from pydantic import BaseModel


class SlotDefinition(BaseModel):
    description: str
    type: str
    required: bool = True
    example: str = ""


class APISchema(BaseModel):
    name: str
    description: str
    slots: dict[str, SlotDefinition]
    example_phrases: list[str] = []


class CategoryDefinition(BaseModel):
    name: str
    description: str
    apis: list[APISchema]
    extra_prompt_hints: str = ""
