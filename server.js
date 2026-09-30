const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT) || 3000;

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

const sessions = new Map();

fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "[]", "utf8");
}


/* =========================================================
   USUARIOS
========================================================= */

function leerUsuarios() {
    try {
        return JSON.parse(
            fs.readFileSync(USERS_FILE, "utf8")
        );
    } catch {
        return [];
    }
}


function guardarUsuarios(usuarios) {
    fs.writeFileSync(
        USERS_FILE,
        JSON.stringify(usuarios, null, 2),
        "utf8"
    );
}


/* =========================================================
   CONTRASEÑAS
========================================================= */

function hashPassword(
    password,
    salt = crypto.randomBytes(16).toString("hex")
) {
    const hash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

    return `${salt}:${hash}`;
}


function verificarPassword(password, stored) {
    try {
        const [salt, expected] = String(stored).split(":");

        const actual = crypto
            .scryptSync(password, salt, 64)
            .toString("hex");

        return crypto.timingSafeEqual(
            Buffer.from(actual, "hex"),
            Buffer.from(expected, "hex")
        );
    } catch {
        return false;
    }
}


/* =========================================================
   USUARIO PÚBLICO
========================================================= */

function usuarioPublico(usuario) {
    return {
        id: usuario.id,
        username: usuario.username,
        createdAt: usuario.createdAt
    };
}


/* =========================================================
   SESIONES
========================================================= */

function crearSesion(usuarioId) {
    const token = crypto
        .randomBytes(32)
        .toString("hex");

    sessions.set(token, {
        userId: usuarioId,
        createdAt: Date.now()
    });

    return token;
}


function obtenerUsuarioPorSesion(req) {
    const cookies = req.headers.cookie || "";

    const match = cookies.match(
        /(?:^|;\s*)horizonte_session=([^;]+)/
    );

    if (!match) {
        return null;
    }

    const sesion = sessions.get(match[1]);

    if (!sesion) {
        return null;
    }

    const usuarios = leerUsuarios();

    return usuarios.find(
        usuario => usuario.id === sesion.userId
    ) || null;
}


/* =========================================================
   RESPUESTAS
========================================================= */

function enviarJSON(
    res,
    status,
    datos,
    cookies = []
) {
    res.writeHead(status, {
        "Content-Type":
            "application/json; charset=utf-8",

        "Cache-Control": "no-store",

        ...(cookies.length
            ? { "Set-Cookie": cookies }
            : {})
    });

    res.end(
        JSON.stringify(datos)
    );
}


/* =========================================================
   LEER BODY
========================================================= */

function leerBody(req) {
    return new Promise(
        (resolve, reject) => {
            let body = "";

            req.on(
                "data",
                chunk => {
                    body += chunk;

                    if (body.length > 10000) {
                        reject(
                            new Error(
                                "Solicitud demasiado grande."
                            )
                        );

                        req.destroy();
                    }
                }
            );

            req.on(
                "end",
                () => {
                    try {
                        resolve(
                            body
                                ? JSON.parse(body)
                                : {}
                        );
                    } catch {
                        reject(
                            new Error(
                                "JSON inválido."
                            )
                        );
                    }
                }
            );

            req.on(
                "error",
                reject
            );
        }
    );
}


/* =========================================================
   VALIDACIÓN
========================================================= */

function validarCredenciales(
    username,
    password
) {
    if (
        typeof username !== "string" ||
        !/^[a-zA-Z0-9_.-]{3,40}$/.test(
            username
        )
    ) {
        return (
            "El nombre debe tener entre 3 y 40 caracteres y solo puede usar letras, números, ., _ o -."
        );
    }

    if (
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 200
    ) {
        return (
            "La contraseña debe tener entre 8 y 200 caracteres."
        );
    }

    return null;
}


/* =========================================================
   ARCHIVOS
========================================================= */

const MIME_TYPES = {
    ".html":
        "text/html; charset=utf-8",

    ".js":
        "text/javascript; charset=utf-8",

    ".css":
        "text/css; charset=utf-8",

    ".json":
        "application/json; charset=utf-8",

    ".png":
        "image/png",

    ".jpg":
        "image/jpeg",

    ".jpeg":
        "image/jpeg",

    ".svg":
        "image/svg+xml",

    ".ico":
        "image/x-icon"
};


function servirArchivo(
    req,
    res,
    pathname
) {
    const archivoSolicitado =
        pathname === "/"
            ? "index.html"
            : pathname;

    const filePath = path.normalize(
        path.join(
            ROOT,
            archivoSolicitado
        )
    );

    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    fs.stat(
        filePath,
        (error, stat) => {
            if (
                error ||
                !stat.isFile()
            ) {
                res.writeHead(
                    404,
                    {
                        "Content-Type":
                            "text/plain; charset=utf-8"
                    }
                );

                res.end(
                    "No encontrado"
                );

                return;
            }

            const extension =
                path.extname(
                    filePath
                ).toLowerCase();

            res.writeHead(
                200,
                {
                    "Content-Type":
                        MIME_TYPES[
                            extension
                        ] ||
                        "application/octet-stream",

                    "Cache-Control":
                        "no-cache"
                }
            );

            fs.createReadStream(
                filePath
            ).pipe(res);
        }
    );
}


/* =========================================================
   SERVIDOR
========================================================= */

const server =
    http.createServer(
        async (req, res) => {

            const url =
                new URL(
                    req.url,
                    `http://${
                        req.headers.host ||
                        "localhost"
                    }`
                );


            /* ===============================
               REGISTRO
            =============================== */

            if (
                url.pathname ===
                    "/api/auth/register" &&
                req.method === "POST"
            ) {
                try {
                    const body =
                        await leerBody(req);

                    const username =
                        String(
                            body.username ||
                            ""
                        ).trim();

                    const password =
                        String(
                            body.password ||
                            ""
                        );


                    const error =
                        validarCredenciales(
                            username,
                            password
                        );


                    if (error) {
                        enviarJSON(
                            res,
                            400,
                            {
                                error
                            }
                        );

                        return;
                    }


                    const usuarios =
                        leerUsuarios();


                    const existe =
                        usuarios.some(
                            usuario =>
                                usuario.username
                                    .toLowerCase() ===
                                username
                                    .toLowerCase()
                        );


                    if (existe) {
                        enviarJSON(
                            res,
                            409,
                            {
                                error:
                                    "Ese nombre de usuario ya está registrado."
                            }
                        );

                        return;
                    }


                    const usuario = {
                        id:
                            crypto.randomUUID(),

                        username,

                        passwordHash:
                            hashPassword(
                                password
                            ),

                        createdAt:
                            new Date()
                                .toISOString()
                    };


                    usuarios.push(
                        usuario
                    );

                    guardarUsuarios(
                        usuarios
                    );


                    const token =
                        crearSesion(
                            usuario.id
                        );


                    enviarJSON(
                        res,
                        201,
                        {
                            ok: true,

                            user:
                                usuarioPublico(
                                    usuario
                                )
                        },
                        [
                            `horizonte_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
                        ]
                    );

                    return;

                } catch (error) {

                    enviarJSON(
                        res,
                        400,
                        {
                            error:
                                error.message ||
                                "No se pudo crear la cuenta."
                        }
                    );

                    return;
                }
            }


            /* ===============================
               LOGIN
            =============================== */

            if (
                url.pathname ===
                    "/api/auth/login" &&
                req.method === "POST"
            ) {
                try {
                    const body =
                        await leerBody(req);

                    const username =
                        String(
                            body.username ||
                            ""
                        ).trim();

                    const password =
                        String(
                            body.password ||
                            ""
                        );


                    const usuarios =
                        leerUsuarios();


                    const usuario =
                        usuarios.find(
                            elemento =>
                                elemento.username
                                    .toLowerCase() ===
                                username
                                    .toLowerCase()
                        );


                    if (
                        !usuario ||
                        !verificarPassword(
                            password,
                            usuario.passwordHash
                        )
                    ) {
                        enviarJSON(
                            res,
                            401,
                            {
                                error:
                                    "Nombre de usuario o contraseña incorrectos."
                            }
                        );

                        return;
                    }


                    const token =
                        crearSesion(
                            usuario.id
                        );


                    enviarJSON(
                        res,
                        200,
                        {
                            ok: true,

                            user:
                                usuarioPublico(
                                    usuario
                                )
                        },
                        [
                            `horizonte_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
                        ]
                    );

                    return;

                } catch {

                    enviarJSON(
                        res,
                        400,
                        {
                            error:
                                "No se pudo iniciar sesión."
                        }
                    );

                    return;
                }
            }


            /* ===============================
               COMPROBAR SESIÓN
            =============================== */

            if (
                url.pathname ===
                    "/api/auth/me" &&
                req.method === "GET"
            ) {
                const usuario =
                    obtenerUsuarioPorSesion(
                        req
                    );


                enviarJSON(
                    res,
                    200,
                    {
                        user:
                            usuario
                                ? usuarioPublico(
                                    usuario
                                )
                                : null
                    }
                );

                return;
            }


            /* ===============================
               LOGOUT
            =============================== */

            if (
                url.pathname ===
                    "/api/auth/logout" &&
                req.method === "POST"
            ) {
                const cookies =
                    req.headers.cookie ||
                    "";

                const match =
                    cookies.match(
                        /(?:^|;\s*)horizonte_session=([^;]+)/
                    );


                if (match) {
                    sessions.delete(
                        match[1]
                    );
                }


                enviarJSON(
                    res,
                    200,
                    {
                        ok: true
                    },
                    [
                        "horizonte_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
                    ]
                );

                return;
            }


            /* ===============================
               API NO ENCONTRADA
            =============================== */

            if (
                url.pathname.startsWith(
                    "/api/"
                )
            ) {
                enviarJSON(
                    res,
                    404,
                    {
                        error:
                            "Endpoint no encontrado."
                    }
                );

                return;
            }


            /* ===============================
               PÁGINA
            =============================== */

            servirArchivo(
                req,
                res,
                url.pathname
            );
        }
    );


server.listen(
    PORT,
    () => {
        console.log(
            `Horizonte funcionando en http://localhost:${PORT}`
        );
    }
);
