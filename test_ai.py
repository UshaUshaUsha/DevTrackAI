from ai_service import analyze_issue

result = analyze_issue(
    title="Login failure",
    description="User cannot log in even with valid credentials"
)

print("\nAI ANALYSIS RESULT:")
print(result)