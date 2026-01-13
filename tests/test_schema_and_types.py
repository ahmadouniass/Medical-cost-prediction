import pandas as pd

EXPECTED_COLUMNS = ["age", "sex", "bmi", "children", "smoker", "region", "charges"]

def test_columns_exist(df: pd.DataFrame):
    assert list(df.columns) == EXPECTED_COLUMNS, "Le dataset doit contenir exactement les colonnes attendues."

def test_basic_dtypes(df: pd.DataFrame):
    # numériques
    assert pd.api.types.is_numeric_dtype(df["age"])
    assert pd.api.types.is_numeric_dtype(df["bmi"])
    assert pd.api.types.is_numeric_dtype(df["children"])
    assert pd.api.types.is_numeric_dtype(df["charges"])

    # catégorielles (object)
    assert df["sex"].dtype == object
    assert df["smoker"].dtype == object
    assert df["region"].dtype == object
