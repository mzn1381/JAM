from typing import Any

from app.usage.domain.enums import BillingModel, ResourceType
from app.usage.models import PricingDecision


class PricingEngine:
    def __init__(self, default_billing_model: BillingModel):
        self.default_billing_model = default_billing_model

    def resolve(self, account_doc: dict[str, Any] | None, requested_billing_model: BillingModel | None) -> PricingDecision:
        if requested_billing_model is not None:
            billing_model = requested_billing_model
        elif account_doc and account_doc.get("billing_model"):
            billing_model = BillingModel(account_doc["billing_model"])
        else:
            billing_model = self.default_billing_model

        resource_type = ResourceType.MESSAGE if billing_model == BillingModel.PER_MESSAGE else ResourceType.SESSION

        return PricingDecision(
            billing_model=billing_model,
            resource_type=resource_type,
            units=1,
        )
