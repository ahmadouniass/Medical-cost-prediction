from fastapi import FastAPI

app = FastAPI(title="Health Cost API")

@app.get("/health")
def health():
    return {"status": "ok"}
