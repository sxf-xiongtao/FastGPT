#!/usr/bin/env python
# -*- coding: utf-8 -*-
'''
@File    :   base.py
@Contact :   1181348296@qq.com

@Modify Time      @Author    @Version    @Desciption
------------      -------    --------    -----------
2023/10/24 0:41   HZD      1.0         None
'''
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
sys.path.append(os.path.dirname(__file__))

import argparse
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from utils.log import build_logger
from config import settings
from fastapi.staticfiles import StaticFiles
from core import middleware, router
from fastapi.templating import Jinja2Templates
from fastapi.openapi.docs import (get_redoc_html, get_swagger_ui_html, get_swagger_ui_oauth2_redirect_html)
from fastapi.openapi.utils import get_openapi
from core.exception import *

application = FastAPI(
    debug=settings.APP_DEBUG,
    docs_url=None,
    redoc_url=None,
    swagger_ui_oauth2_redirect_url=settings.SWAGGER_UI_OAUTH2_REDIRECT_URL,
)


# custom_openapi
def custom_openapi():
    if application.openapi_schema:
        return application.openapi_schema
    openapi_schema = get_openapi(
        description=settings.DESCRIPTION,
        version=settings.VERSION,
        title=settings.PROJECT_NAME,
        routes=app.routes,
    )
    openapi_schema["info"]["x-logo"] = {
        "url": "/logo-teal.png"
    }
    application.openapi_schema = openapi_schema
    return application.openapi_schema


application.openapi = custom_openapi


# custom_swagger_ui_html
@application.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=application.openapi_url,
        title=application.title + " - Swagger UI",
        oauth2_redirect_url=application.swagger_ui_oauth2_redirect_url,
        swagger_js_url="/swagger-ui-bundle.js",
        swagger_css_url="/swagger-ui.css",
    )


# swagger_ui_oauth2_redirect_url
@application.get(application.swagger_ui_oauth2_redirect_url, include_in_schema=False)
async def swagger_ui_redirect():
    return get_swagger_ui_oauth2_redirect_html()


# redoc
@application.get("/redoc", include_in_schema=False)
async def redoc_html():
    return get_redoc_html(
        openapi_url=application.openapi_url,
        title=application.title + " - ReDoc",
        redoc_js_url="/redoc.standalone.js",
    )


# # 异常错误处理
application.add_exception_handler(HTTPException, http_error_handler)
application.add_exception_handler(RequestValidationError, http422_error_handler)
application.add_exception_handler(UnicornException, unicorn_exception_handler)
application.add_exception_handler(OperationalError, mysql_operational_error)

# 中间件
application.add_middleware(middleware.BaseMiddleware)

application.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

application.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    session_cookie=settings.SESSION_COOKIE,
    max_age=settings.SESSION_MAX_AGE
)

# 路由
application.include_router(router.router)

# 静态资源目录
application.mount('/', StaticFiles(directory=settings.STATIC_DIR), name="static")
application.state.views = Jinja2Templates(directory=settings.TEMPLATE_DIR)

# logger
LOG_PATH = os.path.join(os.path.dirname(__file__), "logs")
server_logger = build_logger("server", LOG_PATH + "/server.log")

app = application


def run_api(host, port, **kwargs):
    if kwargs.get("ssl_keyfile") and kwargs.get("ssl_certfile"):
        uvicorn.run("api:app",
                    host=host,
                    port=port,
                    ssl_keyfile=kwargs.get("ssl_keyfile"),
                    ssl_certfile=kwargs.get("ssl_certfile"),
                    reload=kwargs.get("reload", False),
                    log_config=None,
                    )
    else:
        uvicorn.run("app:app", host=host, port=port, reload=kwargs.get("reload", False), log_config=None,)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(prog='fastai',
                                     description='Fastai后端脚手架')
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--port", type=int, default=6006)
    parser.add_argument("--debug", action="store_true", default=False)
    parser.add_argument("--ssl_keyfile", type=str)
    parser.add_argument("--ssl_certfile", type=str)
    parser.add_argument("--reload", action="store_true", default=False)
    args = parser.parse_args()
    args_dict = vars(args)
    run_api(host=args.host,
            port=args.port,
            ssl_keyfile=args.ssl_keyfile,
            ssl_certfile=args.ssl_certfile,
            reload=args.reload,
            debug=args.debug
            )
