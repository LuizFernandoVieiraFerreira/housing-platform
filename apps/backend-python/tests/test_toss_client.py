from housing_platform.payments.toss_client import TossClient


def test_dev_mock_confirm_skips_toss_api() -> None:
    client = TossClient(secret_key="", payment_dev_mock=True)

    result = client.confirm_payment(
        payment_key="devmock_order-123",
        order_id="order-123",
        amount=50_000,
    )

    assert result["status"] == "DONE"
    assert result["method"] == "DEV_MOCK"


def test_is_successful_and_failed_status_helpers() -> None:
    client = TossClient(secret_key="secret")

    assert client.is_successful({"status": "DONE"}) is True
    assert client.is_failed({"status": "CANCELED"}) is True
    assert client.is_failed({"status": "DONE"}) is False
