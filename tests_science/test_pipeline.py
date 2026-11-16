"""Offline regression tests for the scientific pipeline; no network access required."""
import unittest

from science.pipeline import analyze_etnos, normalize_etnos


class MpcNormalizationTests(unittest.TestCase):
    def test_filters_bound_etnos_and_preserves_missing_values(self):
        rows = [
            {"Principal_desig": "2015 TG387", "a": 1170, "e": 0.94, "Perihelion_dist": 70,
             "i": 12, "Node": 300, "Peri": 120, "Epoch": 2460000.5},
            {"Principal_desig": "ordinary-tno", "a": 80, "e": 0.2, "Perihelion_dist": 64,
             "i": 2, "Node": 30, "Peri": 20},
            {"Principal_desig": "unbound", "a": 300, "e": 1.1, "Perihelion_dist": 10,
             "i": 5, "Node": 40, "Peri": 60},
            {"Principal_desig": "missing-angle", "a": 250, "e": 0.8, "Perihelion_dist": 50,
             "i": 10, "Node": None, "Peri": 30},
        ]
        result = normalize_etnos(rows)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["designation"], "2015 TG387")
        self.assertAlmostEqual(result[0]["longitudePerihelionDeg"], 60.0)
        self.assertEqual(result[0]["orbitEpochJD"], 2460000.5)

    def test_empty_or_invalid_catalogue_is_not_fabricated(self):
        self.assertEqual(normalize_etnos([{"a": 200, "e": 0.5}]), [])


class EtnosStatisticsTests(unittest.TestCase):
    def fixture(self):
        return {"dataset": "offline unit-test fixture", "rawSha256": "fixture-hash", "records": [
            {"longitudePerihelionDeg": 10, "inclinationDeg": 5, "longitudeAscendingNodeDeg": 15},
            {"longitudePerihelionDeg": 12, "inclinationDeg": 6, "longitudeAscendingNodeDeg": 16},
            {"longitudePerihelionDeg": 8, "inclinationDeg": 4, "longitudeAscendingNodeDeg": 14},
            {"longitudePerihelionDeg": 11, "inclinationDeg": 7, "longitudeAscendingNodeDeg": 13},
            {"longitudePerihelionDeg": 9, "inclinationDeg": 5, "longitudeAscendingNodeDeg": 17},
        ]}

    def test_seeded_analysis_is_reproducible(self):
        first = analyze_etnos(self.fixture(), simulations=500, seed=42)
        second = analyze_etnos(self.fixture(), simulations=500, seed=42)
        self.assertEqual(first["longitudePerihelion"]["monteCarloPValue"],
                         second["longitudePerihelion"]["monteCarloPValue"])
        self.assertEqual(first["orbitalPole"]["monteCarloPValue"],
                         second["orbitalPole"]["monteCarloPValue"])
        self.assertEqual(first["method"]["seed"], 42)
        self.assertIn("not an unbiased sample", " ".join(first["limitations"]))

    def test_rejects_too_small_sample(self):
        with self.assertRaisesRegex(ValueError, "At least four"):
            analyze_etnos({"records": self.fixture()["records"][:3]}, simulations=100)


if __name__ == "__main__":
    unittest.main()
