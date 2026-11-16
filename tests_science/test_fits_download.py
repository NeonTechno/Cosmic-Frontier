import gzip
import tempfile
import unittest
from pathlib import Path

from science.fits_download import build_cutout_url, download_fits


class FitsDownloadTests(unittest.TestCase):
    def test_cutout_url_is_built_from_official_irsa_host(self):
        url = build_cutout_url("https://irsa.ipac.caltech.edu/ibe/data/spherex/example.fits", 10, -20, 64)
        self.assertIn("center=10.0000000%2C-20.0000000", url)
        self.assertIn("size=64pix", url)

    def test_rejects_non_irsa_hosts(self):
        with self.assertRaisesRegex(ValueError, "Only HTTPS"):
            build_cutout_url("https://example.com/fake.fits", 10, -20, 64)
        with self.assertRaisesRegex(ValueError, "Only HTTPS"):
            build_cutout_url("http://irsa.ipac.caltech.edu/fake.fits", 10, -20, 64)

    def test_rejects_invalid_cutout_dimensions(self):
        with self.assertRaisesRegex(ValueError, "Invalid ICRS"):
            build_cutout_url("https://irsa.ipac.caltech.edu/file.fits", 10, -20, 0)

    def test_rejects_non_fits_response(self):
        # The network boundary is replaced with a deterministic HTML error response.
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "bad.fits"
            with patch("science.fits_download.fetch_url", return_value=(b"<html>not a FITS file</html>", {})):
                with self.assertRaisesRegex(ValueError, "not a primary FITS"):
                    download_fits("https://irsa.ipac.caltech.edu/file.fits", 10, -20, 64, target)
            self.assertFalse(target.exists())

    def test_accepts_gzipped_fits_signature_and_hashes_original_bytes(self):
        from unittest.mock import patch
        raw = b"SIMPLE  =                    T / FITS\n"
        compressed = gzip.compress(raw)
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "good.fits.gz"
            with patch("science.fits_download.fetch_url", return_value=(compressed, {"last-modified": "Mon, 01 Jan 2024 00:00:00 GMT"})):
                result = download_fits("https://irsa.ipac.caltech.edu/file.fits.gz", 10, -20, 64, target)
            self.assertTrue(result["fitsSignatureValidated"])
            self.assertTrue(result["isGzip"])
            self.assertEqual(target.read_bytes(), compressed)


if __name__ == "__main__":
    unittest.main()
