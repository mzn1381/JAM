import json
import os
from pathlib import Path

from app.chat.api.definitions import APISchema, CategoryDefinition, SlotDefinition

# _data_path = Path(__file__).parent.parent / "data" / "categories.json"
_data_path = Path(__file__).parent.parent / "data" / "categories_JAM.json"
with open(_data_path, encoding="utf-8") as f:
    _data = json.load(f)

CLASSIFIER_HINT: str = _data.get("classifier_hint", "")
ACTION_NAVIGATOR_HINT: str = _data.get("action_navigator_hint", "")


def _parse_category(raw: dict) -> CategoryDefinition:
    apis = [
        APISchema(
            name=api["name"],
            description=api["description"],
            example_phrases=api.get("example_phrases", []),
            slots={
                name: SlotDefinition(**slot)
                for name, slot in api.get("slots", {}).items()
            },
        )
        for api in raw.get("apis", [])
    ]
    return CategoryDefinition(
        name=raw["name"],
        description=raw["description"],
        apis=apis,
        extra_prompt_hints=raw.get("extra_prompt_hints", ""),
    )


CATEGORIES: dict[str, CategoryDefinition] = {
    cat.name: cat
    for cat in (_parse_category(raw) for raw in _data["categories"])
}

# APPOINTMENT_CATEGORY = CATEGORIES["appointment"] 
# ANDROID_CATEGORY = CATEGORIES["android"]
# INQUIRY_CATEGORY = CATEGORIES["inquiry"]

APPOINTMENT_CATEGORY = 'CATEGORIES["appointment"]' 
ANDROID_CATEGORY = 'CATEGORIES["android"]'
INQUIRY_CATEGORY = 'CATEGORIES["inquiry"]'

VALID_INTENT_NAMES: list[str] = [
    name for name in CATEGORIES if name != "unknown"
]


def get_category(name: str) -> CategoryDefinition | None:
    return CATEGORIES.get(name)


def get_classifier_categories() -> list[dict[str, str]]:
    return [
        {"name": cat.name, "description": cat.description}
        for cat in CATEGORIES.values()
    ]


def get_classifier_categories_with_examples() -> list[dict]:
    categories = []
    for cat in CATEGORIES.values():
        examples: list[str] = []
        seen: set[str] = set()
        for api in cat.apis:
            for phrase in api.example_phrases:
                if phrase not in seen:
                    seen.add(phrase)
                    examples.append(phrase)

        categories.append({
            "name": cat.name,
            "description": cat.description,
            "examples": examples,
        })
    return categories


def _validate_intent_categories() -> None:
    from app.chat.models.models import IntentCategory

    return ### Should be refactored #MGZ 
    
    registry_names = set(CATEGORIES)
    enum_names = {category.value for category in IntentCategory}
    if registry_names != enum_names:
        raise RuntimeError(
            "IntentCategory enum and categories.json are out of sync: "
            f"only in enum={sorted(enum_names - registry_names)}, "
            f"only in json={sorted(registry_names - enum_names)}"
        )


_validate_intent_categories()
