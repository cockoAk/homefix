Descripción breve
-----------------
es una aplicación educativa tipo quiz (estilo Kahoot) creada para promover la cultura dominicana. Es un proyecto académico realizado para la materia P3; funciona como demostración/local y no está pensado para uso en producción.

Estado
------
- Proyecto: Demo para la materia P3/ historia dominicana.
- Producción: No.
- Rama por defecto: `main`. (ejecuccion desde la carpeta backend python -m app.main)


Tecnologías
----------
- HTML, CSS, JavaScript 
- Python 
- No requiere servicios externos para la demo (a menos que se añadan posteriormente).

Requisitos mínimos
------------------
- Navegador moderno (Chrome, Firefox, Edge).
- Node.js y npm solo si deseas levantar un servidor de desarrollo o hay dependencias (opcional). 
- Python 3.8+ solo si quieres ejecutar scripts incluidos (opcional).

Instalación y ejecución (rápido)
-------------------------------
1. Clonar el repositorio:
   git clone https://github.com/cockoAk/homefix.git
   cd homefix

2.1. Ejecución simple (si es solo front-end):
   - Abrir `index.html` en tu navegador (se puede ejecutar de manera local con live server).
   - O servir la carpeta con un servidor estático (recomendado para evitar problemas de CORS):
     npx serve .   # requiere npm
     
2.2.Ejecucion simple(del backend)
  -python -m app.main desde backend/ con el entorno(venv) activo
  -con este actibo se puedes usar en conjunto al frotend o usar la librearia de fastAPI para pruebas (necesita AUTH)


3. librerias:
Package              Version
-------------------- -----------
annotated-doc        0.0.4
annotated-types      0.7.0
anyio                4.11.0
bcrypt               4.0.1
certifi              2025.11.12
cffi                 2.0.0
click                8.3.1
colorama             0.4.6
cryptography         46.0.3
distro               1.9.0
dnspython            2.8.0
ecdsa                0.19.1
email-validator      2.3.0
fastapi              0.121.3
fastapi-cli          0.0.16
fastapi-cloud-cli    0.6.0
fastar               0.8.0
greenlet             3.2.4
h11                  0.16.0
httpcore             1.0.9
httptools            0.7.1
httpx                0.28.1
idna                 3.11
itsdangerous         2.2.0
Jinja2               3.1.6
jiter                0.12.0
markdown-it-py       4.0.0
MarkupSafe           3.0.3
mdurl                0.1.2
openai               2.9.0
orjson               3.11.5
passlib              1.7.4
pip                  25.1.1
pyasn1               0.6.1
pycparser            2.23
pydantic             2.12.4
pydantic_core        2.41.5
pydantic-extra-types 2.10.6
pydantic-settings    2.12.0
Pygments             2.19.2
PyMySQL              1.1.2
python-dateutil      2.9.0.post0
python-dotenv        1.2.1
python-jose          3.5.0
python-multipart     0.0.20
PyYAML               6.0.3
rich                 14.2.0
rich-toolkit         0.17.0
rignore              0.7.6
rsa                  4.9.1
sentry-sdk           2.47.0
shellingham          1.5.4
six                  1.17.0
sniffio              1.3.1
SQLAlchemy           2.0.44
sqlmodel             0.0.27
starlette            0.50.0
tqdm                 4.67.1
typer                0.20.0
typing_extensions    4.15.0
typing-inspection    0.4.2
ujson                5.11.0
urllib3              2.6.1
uvicorn              0.38.0
watchfiles           1.1.1
websockets           15.0.1
