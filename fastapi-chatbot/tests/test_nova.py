import httpx
import json
import time
from typing import List, Dict

# Configuration
API_URL = "http://127.0.0.1:8000/api/v1/chat/nova"
USER_CONTEXT = {
    "name": "Chaitanya",
    "email": "chaitanyahiray1536@gmail.com",
    "subscription": {
        "plan_name": "Free",
        "status": "active"
    }
}

TEST_CASES = [
    {"id": 1, "query": "What is MoneyNow Wealth?", "context": None, "desc": "Identity (Public)"},
    {"id": 2, "query": "How do I contact support?", "context": None, "desc": "Contact Support"},
    {"id": 3, "query": "Who am I?", "context": USER_CONTEXT, "desc": "Personal Identity (Private)"},
    {"id": 4, "query": "Should I stop my SIP if the market crashes?", "context": USER_CONTEXT, "desc": "SIP Logic/Blog"},
    {"id": 5, "query": "What mutual fund categories do you offer?", "context": None, "desc": "Product Categories"},
    {"id": 6, "query": "What is the latest newsletter about?", "context": None, "desc": "Newsletter Content"},
    {"id": 7, "query": "How can I get Premium Access?", "context": USER_CONTEXT, "desc": "Premium Upgrade"},
    {"id": 8, "query": "What do I get with the Premium trial?", "context": None, "desc": "Premium Benefits"},
    {"id": 9, "query": "How much will I have in 10 years if I start a SIP?", "context": USER_CONTEXT, "desc": "Tool Redirection"},
    {"id": 10, "query": "Do you have a tool for retirement planning?", "context": USER_CONTEXT, "desc": "Retirement Calculator"},
    {"id": 11, "query": "Is my money safe? What is your GST?", "context": None, "desc": "Trust & Legal"},
    {"id": 12, "query": "Where is your Privacy Policy?", "context": None, "desc": "Privacy Policy Link"}
]

def run_test(case: Dict):
    print(f"\n--- [TEST {case['id']}] {case['desc']} ---")
    print(f"User: {case['query']}")
    
    payload = {
        "message": case["query"],
        "history": [],
        "user_context": case["context"]
    }
    
    try:
        start_time = time.time()
        response = httpx.post(API_URL, json=payload, timeout=60.0)
        end_time = time.time()
        
        if response.status_code == 200:
            print(f"Status: SUCCESS ({end_time - start_time:.2f}s)")
            print(f"Nova: {response.text[:500]}...") # Print first 500 chars
        else:
            print(f"Status: FAILED ({response.status_code})")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Status: ERROR")
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    print("Starting MoneyNow Wealth Chatbot Test Suite...")
    print("Target URL:", API_URL)
    
    for case in TEST_CASES:
        run_test(case)
        time.sleep(1) # Small delay between tests
    
    print("\nTest Run Complete.")
