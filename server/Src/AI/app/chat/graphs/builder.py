from langgraph.graph import StateGraph, END

from app.chat.models.models import GraphState, IntentCategory
from app.chat.nodes.normalizer_node import normalizer_node
from app.chat.nodes.safeguard_node import safeguard_node, route_after_safeguard
from app.chat.nodes.intent_classifier_node import intent_classifier_node
from app.chat.nodes.greeting_node import greeting_node
from app.chat.nodes.chitchat_node import chitchat_node
from app.chat.nodes.android_node import android_node
from app.chat.nodes.inquiry_node import inquiry_node
from app.chat.nodes.appointment_node import appointment_node
from app.chat.nodes.paziresh_router_node import paziresh_router_node, route_paziresh_sub_intent
from app.chat.nodes.registery_arad import register_user_node
from app.chat.nodes.paziresh_faq_node import paziresh_faq_node
from app.chat.nodes.history_recorder_node import history_recorder_node
from app.chat.logger import get_logger
from app.chat.graphs.checkpointer import get_checkpointer

logger = get_logger("builder")


def route_intent(state: GraphState) -> str:
    if not state.intent:
        return "chitchat"

    category = state.intent.category
    logger.info(f"Routing to: {category.value}")

    if category == IntentCategory.GREETING:
        return "greeting"
    if category == IntentCategory.ANDROID:
        return "android"
    if category == IntentCategory.INQUIRY:
        return "inquiry"
    if category == IntentCategory.APPOINTMENT:
        return "paziresh_router"
    if category == IntentCategory.CHITCHAT:
        return "chitchat"
    if category == IntentCategory.REGISTERY_ARAD:
        return "registery_arad"

    return "chitchat"


def build_graph(llm):
    
    workflow_jam = StateGraph(GraphState)
    
    workflow_jam.add_node("normalizer", normalizer_node)
    workflow_jam.add_node("safeguard", safeguard_node)
    
    workflow_jam.add_node("greeting", lambda s: greeting_node(s, llm))
    workflow_jam.add_node("chitchat", lambda s: chitchat_node(s, llm))
    workflow_jam.add_node("history_recorder", history_recorder_node)
    
    workflow_jam.add_node("is_action",  lambda s: is_action_node(s, llm)) ## prompt template for is rag or not 
    workflow_jam.add_node("rag", lambda s: rag_node(s, llm)) ## routing rag api == > RAG flow 
    workflow_jam.add_node("action_navigator", lambda s: action_navigator_node(s, llm)) ### routing proper api 


#######################################
    workflow_jam.add_edge("normalizer", "safeguard")
    workflow_jam.add_edge("greeting", "history_recorder")
    workflow_jam.add_edge("chitchat", "history_recorder")
    workflow_jam.add_edge("is_action", "history_recorder")
    workflow_jam.add_edge("rag", "history_recorder")
    workflow_jam.add_edge("action_navigator", "history_recorder")
    
    workflow_jam.set_entry_point("normalizer")




    workflow_jam.add_conditional_edges(
        "safeguard",
        route_after_safeguard,
        {
            "blocked": "history_recorder",
            "continue": "is_action",
        },
    )

    workflow_jam.add_conditional_edges(
        "is_action",
        route_intent,
        {
            "greeting": "greeting",
            "rag": "rag",
            "chitchat": "chitchat",
            "action": "action_navigator",
        },
    )


    workflow_jam.add_edge("history_recorder", END)
    
    
    ############################################################

  
    
    
    
    
    workflow = StateGraph(GraphState)

    workflow.add_node("normalizer", normalizer_node)
    workflow.add_node("safeguard", safeguard_node)
    workflow.add_node("greeting", lambda s: greeting_node(s, llm))
    workflow.add_node("chitchat", lambda s: chitchat_node(s, llm))
    workflow.add_node("history_recorder", history_recorder_node)
    
    
    
    workflow.add_node("intent_classifier", lambda s: intent_classifier_node(s, llm))
    
    workflow.add_node("android", lambda s: android_node(s, llm))
    workflow.add_node("inquiry", lambda s: inquiry_node(s, llm))
    workflow.add_node("paziresh_router", lambda s: paziresh_router_node(s, llm))
    workflow.add_node("registery_arad", lambda s: register_user_node(s, llm))
    workflow.add_node("appointment", lambda s: appointment_node(s, llm))
    workflow.add_node("paziresh_faq", lambda s: paziresh_faq_node(s, llm))
    
    
    
    
    
    
    
    

    workflow.set_entry_point("normalizer")
    workflow.add_edge("normalizer", "safeguard")

    workflow.add_conditional_edges(
        "safeguard",
        route_after_safeguard,
        {
            "blocked": "history_recorder",
            "continue": "intent_classifier",
        },
    )

    workflow.add_conditional_edges(
        "intent_classifier",
        route_intent,
        {
            "greeting": "greeting",
            "android": "android",
            "inquiry": "inquiry",
            "paziresh_router": "paziresh_router",
            "chitchat": "chitchat",
            "registery_arad": "registery_arad",
        },
    )

    workflow.add_conditional_edges(
        "paziresh_router",
        route_paziresh_sub_intent,
        {
            "appointment": "appointment",
            "paziresh_faq": "paziresh_faq",
        },
    )

    workflow.add_edge("greeting", "history_recorder")
    workflow.add_edge("chitchat", "history_recorder")
    workflow.add_edge("android", "history_recorder")
    workflow.add_edge("inquiry", "history_recorder")
    workflow.add_edge("appointment", "history_recorder")
    workflow.add_edge("paziresh_faq", "history_recorder")
    workflow.add_edge("registery_arad", "history_recorder")
    workflow.add_edge("history_recorder", END)

    return workflow.compile(checkpointer=get_checkpointer())
