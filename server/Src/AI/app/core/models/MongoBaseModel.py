from pydantic import BaseModel, ConfigDict, Field

class MongoDocument(BaseModel):
    id: str | None = Field(
        default=None,
        validation_alias="_id",
        serialization_alias="id",
    )

    model_config = ConfigDict(
        populate_by_name=True,
    )