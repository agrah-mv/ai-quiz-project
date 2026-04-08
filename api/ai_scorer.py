import os
import json
from typing import Dict, Any, List
from groq import Groq

RUBRIC_KEYS = ("relevance", "creativity", "clarity", "impact")
ENTRY_PROMPT = "In exactly 25 words, tell us why you should win this prize."


def _word_count_tool(response_text: str) -> Dict[str, Any]:
    count = len(response_text.split())
    return {"word_count": count, "is_exact_25": count == 25}


def _normalize_scores_tool(scores: Dict[str, Any]) -> Dict[str, int]:
    normalized = {}
    for key in RUBRIC_KEYS:
        raw = scores.get(key, 0)
        try:
            value = int(round(float(raw)))
        except (TypeError, ValueError):
            value = 0
        normalized[key] = max(0, min(25, value))
    return normalized


def _aggregate_total_tool(scores: Dict[str, int]) -> int:
    return int(sum(scores.get(k, 0) for k in RUBRIC_KEYS))


def _llm_score_agent(client: Groq, response_text: str, memory: Dict[str, Any]) -> Dict[str, Any]:
    prompt = f"""
You are Agent A (Scoring Agent). Score a 25-word response with this rubric (0-25 each):
- relevance
- creativity
- clarity
- impact

Competition prompt: "{ENTRY_PROMPT}"
Response: "{response_text}"
Memory:
{json.dumps(memory, ensure_ascii=True)}

Return JSON ONLY with:
{{
  "relevance": int,
  "creativity": int,
  "clarity": int,
  "impact": int,
  "reasoning": "short rationale"
}}
"""
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        response_format={"type": "json_object"},
    )
    return json.loads(completion.choices[0].message.content)


def _llm_review_agent(client: Groq, response_text: str, candidate: Dict[str, Any], memory: Dict[str, Any]) -> Dict[str, Any]:
    prompt = f"""
You are Agent B (Review Agent). Review Agent A's score for fairness and consistency.
If needed, adjust rubric scores by up to 5 points per category.

Competition prompt: "{ENTRY_PROMPT}"
Response: "{response_text}"
Agent A output:
{json.dumps(candidate, ensure_ascii=True)}
Memory:
{json.dumps(memory, ensure_ascii=True)}

Return JSON ONLY:
{{
  "relevance": int,
  "creativity": int,
  "clarity": int,
  "impact": int,
  "review_notes": "short notes"
}}
"""
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
        response_format={"type": "json_object"},
    )
    return json.loads(completion.choices[0].message.content)


def evaluate_creative_response(response_text: str) -> Dict[str, Any]:
    """
    Multi-agent adjudication pipeline:
    - Memory: context with prompt + constraints + recent step outputs
    - Agent A: initial rubric scoring
    - Agent B: review/adjustment
    - Tool calling: word count, score normalization, total aggregation
    - Audit: returns `audit_events` for persistence by caller
    """
    memory: Dict[str, Any] = {
        "task": "adjudicate_25_word_entry",
        "rubric_caps": {k: 25 for k in RUBRIC_KEYS},
        "entry_prompt": ENTRY_PROMPT,
        "steps": [],
    }
    audit_events: List[Dict[str, Any]] = []

    word_meta = _word_count_tool(response_text)
    memory["steps"].append({"stage": "precheck", "result": word_meta})
    audit_events.append(
        {
            "stage": "precheck",
            "agent": "orchestrator",
            "tool_name": "word_count_tool",
            "input_payload": {"response_text": response_text},
            "output_payload": word_meta,
        }
    )

    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not api_key:
        fallback_scores = {"relevance": 0, "creativity": 0, "clarity": 0, "impact": 0}
        if word_meta["is_exact_25"]:
            fallback_scores = {"relevance": 18, "creativity": 18, "clarity": 18, "impact": 18}
        total = _aggregate_total_tool(fallback_scores)
        audit_events.append(
            {
                "stage": "fallback",
                "agent": "orchestrator",
                "tool_name": "fallback_scoring",
                "input_payload": {"has_api_key": False},
                "output_payload": {"scores": fallback_scores, "total_score": total},
            }
        )
        return {**fallback_scores, "total_score": total, "word_count": word_meta["word_count"], "audit_events": audit_events}

    try:
        client = Groq(api_key=api_key)
        agent_a_raw = _llm_score_agent(client, response_text, memory)
        audit_events.append(
            {
                "stage": "agent_a_raw",
                "agent": "scoring_agent",
                "tool_name": None,
                "input_payload": {"response_text": response_text},
                "output_payload": agent_a_raw,
            }
        )

        agent_a_scores = _normalize_scores_tool(agent_a_raw)
        audit_events.append(
            {
                "stage": "agent_a_normalized",
                "agent": "scoring_agent",
                "tool_name": "normalize_scores_tool",
                "input_payload": agent_a_raw,
                "output_payload": agent_a_scores,
            }
        )
        memory["steps"].append({"stage": "agent_a", "result": agent_a_scores})

        agent_b_raw = _llm_review_agent(client, response_text, agent_a_scores, memory)
        audit_events.append(
            {
                "stage": "agent_b_raw",
                "agent": "review_agent",
                "tool_name": None,
                "input_payload": {"agent_a_scores": agent_a_scores},
                "output_payload": agent_b_raw,
            }
        )

        final_scores = _normalize_scores_tool(agent_b_raw)
        total = _aggregate_total_tool(final_scores)
        audit_events.append(
            {
                "stage": "finalize",
                "agent": "orchestrator",
                "tool_name": "aggregate_total_tool",
                "input_payload": final_scores,
                "output_payload": {"total_score": total},
            }
        )

        return {
            **final_scores,
            "total_score": total,
            "word_count": word_meta["word_count"],
            "audit_events": audit_events,
        }
    except Exception as exc:
        print(f"LLM Error: {exc}")
        zero_scores = {"relevance": 0, "creativity": 0, "clarity": 0, "impact": 0}
        return {
            **zero_scores,
            "total_score": 0,
            "word_count": word_meta["word_count"],
            "audit_events": audit_events
            + [
                {
                    "stage": "error",
                    "agent": "orchestrator",
                    "tool_name": None,
                    "input_payload": {"error_type": type(exc).__name__},
                    "output_payload": {"message": str(exc)},
                }
            ],
        }


def generate_shortlist(entries: List[Dict[str, Any]], top_k: int = 10) -> Dict[str, Any]:
    """
    Shortlist pipeline output using scored entries.
    Input item contract: {"user_id": int, "content": str, "scores": {...}}
    """
    ranked = sorted(
        entries,
        key=lambda e: (
            e["scores"].get("total_score", 0),
            e["scores"].get("impact", 0),
            e["scores"].get("creativity", 0),
        ),
        reverse=True,
    )
    shortlist = ranked[: max(1, int(top_k))]
    return {
        "count": len(shortlist),
        "entries": shortlist,
        "method": "total_score_desc_then_impact_then_creativity",
    }
