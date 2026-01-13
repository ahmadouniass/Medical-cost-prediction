import pandas as pd

def test_category_levels(df: pd.DataFrame):
    # Valeurs attendues dans insurance.csv
    assert set(df["sex"].unique()) <= {"female", "male"}
    assert set(df["smoker"].unique()) <= {"yes", "no"}
    assert set(df["region"].unique()) <= {"northeast", "northwest", "southeast", "southwest"}
