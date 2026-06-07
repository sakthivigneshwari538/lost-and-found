"""
Email utility — send OTP verification emails via Gmail SMTP.
"""

import random
import smtplib
import string
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.db.session import settings


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP code."""
    return "".join(random.choices(string.digits, k=length))


def send_otp_email(to_email: str, otp_code: str, user_name: str) -> bool:
    """
    Send an OTP verification email via Gmail SMTP.

    Returns True if sent successfully, False otherwise.
    """
    subject = f"Your Verification Code - {settings.SMTP_FROM_NAME}"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a1a2e; margin: 0; font-size: 24px;">Lost & Found Portal</h1>
            <p style="color: #6c757d; margin-top: 4px;">Email Verification</p>
        </div>
        <div style="background: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <p style="color: #333; font-size: 16px; margin-top: 0;">Hi <strong>{user_name}</strong>,</p>
            <p style="color: #555; font-size: 15px;">Use the code below to verify your email address. This code expires in <strong>10 minutes</strong>.</p>
            <div style="text-align: center; margin: 28px 0;">
                <div style="display: inline-block; background: #1a1a2e; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 32px; border-radius: 8px;">
                    {otp_code}
                </div>
            </div>
            <p style="color: #999; font-size: 13px; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
        <p style="color: #adb5bd; font-size: 12px; text-align: center; margin-top: 20px;">
            &copy; Lost & Found Portal
        </p>
    </div>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send OTP to {to_email}: {e}")
        return False
