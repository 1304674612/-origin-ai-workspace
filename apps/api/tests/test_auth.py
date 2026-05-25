from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.core.security import hash_password


@pytest.mark.asyncio
async def test_register_creates_user(client: AsyncClient, db_session: AsyncSession):
    response = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "securepassword123",
        "full_name": "Test User",
    })

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert "origin_token" in response.cookies


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, db_session: AsyncSession):
    await client.post("/api/v1/auth/register", json={
        "email": "dup@example.com",
        "username": "user1",
        "password": "securepassword123",
    })

    response = await client.post("/api/v1/auth/register", json={
        "email": "dup@example.com",
        "username": "user2",
        "password": "securepassword123",
    })

    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, db_session: AsyncSession):
    await client.post("/api/v1/auth/register", json={
        "email": "login@example.com",
        "username": "loginuser",
        "password": "securepassword123",
    })

    response = await client.post("/api/v1/auth/login", json={
        "email": "login@example.com",
        "password": "securepassword123",
    })

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "login@example.com"
    assert "origin_token" in response.cookies


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, db_session: AsyncSession):
    await client.post("/api/v1/auth/register", json={
        "email": "wp@example.com",
        "username": "wpuser",
        "password": "securepassword123",
    })

    response = await client.post("/api/v1/auth/login", json={
        "email": "wp@example.com",
        "password": "wrongpassword",
    })

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
