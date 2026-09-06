# from typing import Any

# from app.core.config import config
# from app.utils import LoggerManager
# from app.utils import RequestHandler
# from app.utils.custom_errors import (
#     PanelApiRequestError,
#     PanelApiNetworkError,
#     PanelApiTimeoutError,
#     PanelApiDNSResolutionError,
#     PanelParseError,
#     PanelApiBadRequestError,
#     PanelApiUnauthorizedError,
#     PanelApiForbiddenError,
#     PanelApiServerError,
# )

# class PanelInterfaceHandler:
#     """
#     Encapsulates parsing and panel communication methods.
#     """
#     def __init__(self, logger_name: str = "PanelInterfaceHandler"):
#         self.logger = LoggerManager.get(logger_name)
#         self.requester = RequestHandler(logger_name,
#         ApiRequestError=PanelApiRequestError,
#         ApiNetworkError=PanelApiNetworkError,
#         ApiTimeoutError=PanelApiTimeoutError,
#         ApiDNSResolutionError=PanelApiDNSResolutionError,
#         ParseError=PanelParseError,
#         ApiBadRequestError=PanelApiBadRequestError,
#         ApiUnauthorizedError=PanelApiUnauthorizedError,
#         ApiForbiddenError=PanelApiForbiddenError,
#         ApiServerError=PanelApiServerError
#         )


#     def send_message_to_panel():
    
#     def send_image_to_panel(self, conversation_id: str, image_path: str = "opening.jpg", panel_url=None, **kwargs) -> dict:
        

#     def send_progress_to_panel(self, message: str, conversation_id: str, panel_url=None, **kwargs) -> dict:
        

    
#     def use_operator_to_answer(self, conversation_id: str, panel_url=None, **kwargs) -> dict:
      
    
#     def update_contact_in_panel(self, contact_id: str, name: str, panel_url=None, custom_attributes: dict = {}, **kwargs) -> dict:
     