const RENTABILIDAD_SIMULADA = 0.05;
const AÑO_ACTUAL = new Date().getFullYear();
const STORAGE_KEY = "horizonte_metas_v5";

const METAS_INICIALES = [

    {
        id: 1,
        nombre: "Mi primera casa",
        objetivo: 25000,
        ahorrado: 8450,
        año: 2032,
        mensual: 170,

        aportaciones: [
            {
                id: 101,
                cantidad: 8450,
                fecha: "2026-09-01"
            }
        ]
    },

    {
        id: 2,
        nombre: "Año sabático",
        objetivo: 12000,
        ahorrado: 3920,
        año: 2030,
        mensual: 120,

        aportaciones: [
            {
                id: 201,
                cantidad: 3920,
                fecha: "2026-09-01"
            }
        ]
    },

    {
        id: 3,
        nombre: "Independencia",
        objetivo: 30000,
        ahorrado: 6280,
        año: 2040,
        mensual: 100,

        aportaciones: [
            {
                id: 301,
                cantidad: 6280,
                fecha: "2026-09-01"
            }
        ]
    }

];


let metas = cargarMetas();


/* =========================================================
   CÍRCULO
========================================================= */

const circulo = [

    {
        nombre: "Andrea",
        aportado: 3240
    },

    {
        nombre: "Lucía",
        aportado: 2800
    },

    {
        nombre: "Carlos",
        aportado: 2100
    },

    {
        nombre: "Tú",
        aportado: 1650
    },

    {
        nombre: "María",
        aportado: 650
    }

];


const CIRCULO_OBJETIVO = 18000;



/* =========================================================
   AUTENTICACIÓN
   Las contraseñas NO se guardan en localStorage.
   El servidor las almacena con hash seguro.
========================================================= */

let usuarioActual = null;

const API_AUTH = "/api/auth";

async function apiAuth(endpoint, options = {}) {

    const respuesta =
        await fetch(
            `${API_AUTH}${endpoint}`,
            {
                credentials: "include",

                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                },

                ...options
            }
        );


    let datos = {};

    try {

        datos =
            await respuesta.json();

    } catch (_) {

        datos = {};

    }


    if (!respuesta.ok) {

        throw new Error(
            datos.error ||
            "No se ha podido completar la operación."
        );

    }


    return datos;

}


function mostrarAuthModal(
    vista = "login"
) {

    const modal =
        document.getElementById(
            "authModal"
        );


    if (!modal) return;


    modal.hidden =
        false;


    cambiarVistaAuth(
        vista
    );


    setTimeout(
        () => {

            const selector =
                vista === "register"
                    ? "#registerUsername"
                    : "#loginUsername";


            document
                .querySelector(
                    selector
                )
                ?.focus();

        },
        50
    );

}


function cerrarAuthModal() {

    const modal =
        document.getElementById(
            "authModal"
        );


    if (modal) {

        modal.hidden =
            true;

    }

}


function cambiarVistaAuth(
    vista
) {

    const login =
        document.getElementById(
            "authLoginView"
        );


    const register =
        document.getElementById(
            "authRegisterView"
        );


    const profile =
        document.getElementById(
            "authProfileView"
        );


    if (login) {

        login.hidden =
            vista !== "login";

    }


    if (register) {

        register.hidden =
            vista !== "register";

    }


    if (profile) {

        profile.hidden =
            vista !== "profile";

    }


    document
        .getElementById(
            "loginError"
        )
        ?.setAttribute(
            "hidden",
            ""
        );


    document
        .getElementById(
            "registerError"
        )
        ?.setAttribute(
            "hidden",
            ""
        );

}


function mostrarAuthError(
    id,
    mensaje
) {

    const elemento =
        document.getElementById(
            id
        );


    if (!elemento) return;


    elemento.textContent =
        mensaje;


    elemento.hidden =
        false;

}


function actualizarBotonPerfil() {

    const boton =
        document.getElementById(
            "profileButton"
        );


    if (!boton) return;


    boton.textContent =
        usuarioActual
            ? usuarioActual.username
            : "Iniciar sesión";

}


function actualizarVistaPerfil() {

    const nombre =
        document.getElementById(
            "profileUsername"
        );


    if (nombre) {

        nombre.textContent =
            usuarioActual
                ? `Hola, ${usuarioActual.username}`
                : "";

    }

}


async function comprobarSesion() {

    try {

        const datos =
            await apiAuth(
                "/me"
            );


        usuarioActual =
            datos.user ||
            null;

    } catch (error) {

        usuarioActual =
            null;

    }


    actualizarBotonPerfil();

}


async function registrarUsuario(
    event
) {

    event.preventDefault();


    const username =
        document
            .getElementById(
                "registerUsername"
            )
            ?.value
            .trim();


    const password =
        document
            .getElementById(
                "registerPassword"
            )
            ?.value ||
        "";


    const password2 =
        document
            .getElementById(
                "registerPassword2"
            )
            ?.value ||
        "";


    if (
        password !==
        password2
    ) {

        mostrarAuthError(
            "registerError",
            "Las contraseñas no coinciden."
        );

        return;

    }


    try {

        const datos =
            await apiAuth(
                "/register",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            username,
                            password
                        })
                }
            );


        usuarioActual =
            datos.user;


        actualizarBotonPerfil();


        cerrarAuthModal();


        document
            .getElementById(
                "registerForm"
            )
            ?.reset();


        mostrarToast(
            `Cuenta creada. Bienvenida, ${usuarioActual.username}`
        );

    } catch (error) {

        mostrarAuthError(
            "registerError",
            error.message
        );

    }

}


async function iniciarSesion(
    event
) {

    event.preventDefault();


    const username =
        document
            .getElementById(
                "loginUsername"
            )
            ?.value
            .trim();


    const password =
        document
            .getElementById(
                "loginPassword"
            )
            ?.value ||
        "";


    try {

        const datos =
            await apiAuth(
                "/login",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            username,
                            password
                        })
                }
            );


        usuarioActual =
            datos.user;


        actualizarBotonPerfil();


        document
            .getElementById(
                "loginForm"
            )
            ?.reset();


        cerrarAuthModal();


        mostrarToast(
            `Bienvenida, ${usuarioActual.username}`
        );

    } catch (error) {

        mostrarAuthError(
            "loginError",
            error.message
        );

    }

}


async function cerrarSesion() {

    try {

        await apiAuth(
            "/logout",
            {
                method: "POST"
            }
        );

    } catch (error) {

        console.error(
            error
        );

    }


    usuarioActual =
        null;


    actualizarBotonPerfil();


    cerrarAuthModal();


    mostrarToast(
        "Sesión cerrada"
    );

}


function abrirPerfil() {

    if (!usuarioActual) {

        mostrarAuthModal(
            "login"
        );

        return;

    }


    actualizarVistaPerfil();


    mostrarAuthModal(
        "profile"
    );

}


/* =========================================================
   CARGAR Y GUARDAR
========================================================= */

function copiar(
    objeto
) {

    return JSON.parse(
        JSON.stringify(
            objeto
        )
    );

}


function cargarMetas() {

    try {

        const guardadas =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!guardadas) {

            return copiar(
                METAS_INICIALES
            );

        }


        const datos =
            JSON.parse(
                guardadas
            );


        if (
            !Array.isArray(
                datos
            )
        ) {

            return copiar(
                METAS_INICIALES
            );

        }


        return datos.map(
            normalizarMeta
        );

    } catch (error) {

        console.error(
            "No se pudieron cargar las metas:",
            error
        );


        return copiar(
            METAS_INICIALES
        );

    }

}


function normalizarMeta(
    meta
) {

    const aportaciones =
        Array.isArray(
            meta.aportaciones
        )
            ? meta.aportaciones
            : [];


    const ahorrado =
        aportaciones.length
            ? aportaciones.reduce(
                (
                    total,
                    aportacion
                ) =>
                    total +
                    Number(
                        aportacion.cantidad || 0
                    ),
                0
            )
            : Number(
                meta.ahorrado || 0
            );


    return {

        ...meta,

        objetivo:
            Number(
                meta.objetivo || 0
            ),

        año:
            Number(
                meta.año ||
                AÑO_ACTUAL + 1
            ),

        mensual:
            Number(
                meta.mensual || 0
            ),

        ahorrado:
            redondear(
                ahorrado
            ),

        aportaciones

    };

}


function guardarMetas() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                metas
            )
        );

    } catch (error) {

        console.error(
            "No se pudieron guardar las metas:",
            error
        );

    }

}


/* =========================================================
   UTILIDADES
========================================================= */

function redondear(
    numero
) {

    return Math.round(
        (
            Number(numero) || 0
        ) * 100
    ) / 100;

}


function euros(
    valor
) {

    return new Intl.NumberFormat(
        "es-ES",
        {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0
        }
    ).format(
        Number(valor) || 0
    );

}


function eurosExactos(
    valor
) {

    return new Intl.NumberFormat(
        "es-ES",
        {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(
        Number(valor) || 0
    );

}


function fechaBonita(
    fecha
) {

    const date =
        new Date(
            `${fecha}T12:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return fecha;

    }


    return new Intl.DateTimeFormat(
        "es-ES",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(
        date
    );

}


function fechaHoy() {

    const hoy =
        new Date();


    const año =
        hoy.getFullYear();


    const mes =
        String(
            hoy.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dia =
        String(
            hoy.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${año}-${mes}-${dia}`
    );

}


function escapeHTML(
    texto
) {

    return String(
        texto
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   CÁLCULOS
========================================================= */

function progresoMeta(
    meta
) {

    if (
        !meta.objetivo
    ) {

        return 0;

    }


    return Math.min(
        100,
        Math.round(
            (
                meta.ahorrado /
                meta.objetivo
            ) * 100
        )
    );

}


function añosRestantes(
    meta
) {

    return Math.max(
        meta.año -
        AÑO_ACTUAL,
        0
    );

}


function valorFuturo(
    capitalInicial,
    mensual,
    años,
    tasa =
        RENTABILIDAD_SIMULADA
) {

    const meses =
        Math.max(
            0,
            Math.round(
                años * 12
            )
        );


    let valor =
        Number(
            capitalInicial
        ) || 0;


    if (
        meses === 0
    ) {

        return valor;

    }


    const tasaMensual =
        tasa / 12;


    for (
        let i = 0;
        i < meses;
        i++
    ) {

        valor *=
            (
                1 +
                tasaMensual
            );


        valor +=
            Number(
                mensual
            ) || 0;

    }


    return valor;

}


function simulacion(
    meta,
    mensual =
        meta.mensual
) {

    const años =
        añosRestantes(
            meta
        );


    const meses =
        años * 12;


    const futuras =
        (
            Number(
                mensual
            ) || 0
        ) *
        meses;


    const total =
        valorFuturo(
            meta.ahorrado,
            mensual,
            años
        );


    const crecimiento =
        Math.max(
            total -
            meta.ahorrado -
            futuras,
            0
        );


    return {

        años,
        meses,
        futuras,
        crecimiento,
        total

    };

}


/* =========================================================
   ICONOS
========================================================= */

function iconoMeta(
    nombre
) {

    const texto =
        nombre.toLowerCase();


    if (
        texto.includes("casa") ||
        texto.includes("vivienda")
    ) {

        return "⌂";

    }


    if (
        texto.includes("viaje") ||
        texto.includes("japón") ||
        texto.includes("japon")
    ) {

        return "✈";

    }


    if (
        texto.includes("independencia")
    ) {

        return "◈";

    }


    return "◎";

}


function descripcionMeta(
    nombre
) {

    const texto =
        nombre.toLowerCase();


    if (
        texto.includes("casa") ||
        texto.includes("vivienda")
    ) {

        return "Entrada para una vivienda";

    }


    if (
        texto.includes("viaje") ||
        texto.includes("japón") ||
        texto.includes("japon")
    ) {

        return "Un proyecto para disfrutar y explorar";

    }


    if (
        texto.includes("independencia")
    ) {

        return "Construir un colchón financiero";

    }


    return "Un objetivo pensado para tu futuro";

}


/* =========================================================
   CREAR META
========================================================= */

function crearMeta() {

    const nombre =
        document.getElementById(
            "nombreMeta"
        )?.value.trim();


    const objetivo =
        Number(
            document.getElementById(
                "objetivoMeta"
            )?.value
        );


    const año =
        Number(
            document.getElementById(
                "añoMeta"
            )?.value
        );


    const mensual =
        Number(
            document.getElementById(
                "mensualMeta"
            )?.value
        );


    if (
        !nombre
    ) {

        alert(
            "Ponle un nombre a tu meta."
        );

        return;

    }


    if (
        !Number.isFinite(
            objetivo
        ) ||
        objetivo <= 0
    ) {

        alert(
            "Introduce un objetivo válido."
        );

        return;

    }


    if (
        !Number.isFinite(
            año
        ) ||
        año <= AÑO_ACTUAL
    ) {

        alert(
            `El año objetivo debe ser posterior a ${AÑO_ACTUAL}.`
        );

        return;

    }


    if (
        !Number.isFinite(
            mensual
        ) ||
        mensual < 0
    ) {

        alert(
            "Introduce una aportación mensual válida."
        );

        return;

    }


    metas.push({

        id:
            Date.now(),

        nombre,

        objetivo,

        ahorrado:
            0,

        año,

        mensual,

        aportaciones:
            []

    });


    guardarMetas();


    [
        "nombreMeta",
        "objetivoMeta",
        "añoMeta",
        "mensualMeta"
    ]
        .forEach(
            id => {

                const input =
                    document.getElementById(
                        id
                    );


                if (input) {

                    input.value =
                        "";

                }

            }
        );


    cerrarFormularioNuevaMeta();

    actualizarTodo();

    mostrarToast(
        "Meta creada correctamente"
    );

}


/* =========================================================
   FORMULARIO NUEVA META
========================================================= */

function abrirFormularioNuevaMeta() {

    const formulario =
        document.getElementById(
            "formularioMeta"
        );


    if (!formulario) {
        return;
    }


    formulario.hidden =
        false;


    formulario.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });


    setTimeout(
        () => {

            document
                .getElementById(
                    "nombreMeta"
                )
                ?.focus();

        },
        250
    );

}


function cerrarFormularioNuevaMeta() {

    const formulario =
        document.getElementById(
            "formularioMeta"
        );


    if (formulario) {

        formulario.hidden =
            true;

    }

}


/* =========================================================
   RENDERIZADO DE METAS
========================================================= */

function renderizarMetas() {

    const contenedor =
        document.getElementById(
            "listaMetas"
        );


    if (!contenedor) {
        return;
    }


    contenedor.innerHTML =
        "";


    if (
        metas.length === 0
    ) {

        contenedor.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ◎
                </div>

                <h3>
                    Aún no tienes metas
                </h3>

                <p>
                    Crea tu primera meta para empezar
                    a construir tu horizonte.
                </p>

            </div>

        `;

        return;

    }


    metas.forEach(
        meta => {

            contenedor.appendChild(
                crearTarjetaMeta(
                    meta
                )
            );

        }
    );

}


function crearTarjetaMeta(
    meta
) {

    const tarjeta =
        document.createElement(
            "article"
        );


    tarjeta.className =
        "goal-card";


    const progreso =
        progresoMeta(
            meta
        );


    const años =
        añosRestantes(
            meta
        );


    const sim =
        simulacion(
            meta
        );


    const registros =
        meta.aportaciones?.length ||
        0;


    tarjeta.innerHTML = `

        <div class="goal-icon">
            ${iconoMeta(
                meta.nombre
            )}
        </div>


        <div class="goal-content">


            <div class="goal-title">

                <div>

                    <h3>
                        ${escapeHTML(
                            meta.nombre
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            descripcionMeta(
                                meta.nombre
                            )
                        )}
                    </p>

                </div>


                <span class="goal-year">
                    ${meta.año}
                </span>

            </div>


            <div class="real-progress-block">

                <div class="progress-info">

                    <span>

                        Has conseguido

                        <strong>
                            ${euros(
                                meta.ahorrado
                            )}
                        </strong>

                        de

                        ${euros(
                            meta.objetivo
                        )}

                    </span>


                    <strong class="progress-percentage">

                        ${progreso}%

                    </strong>

                </div>


                <div class="progress-bar">

                    <div
                        style="
                            width:${progreso}%
                        "
                    ></div>

                </div>

            </div>


            <div class="goal-footer">

                <span>

                    Aportación prevista

                    <strong>
                        ${euros(
                            meta.mensual
                        )}/mes
                    </strong>

                </span>


                <span>

                    <strong>
                        ${años}
                    </strong>

                    ${
                        años === 1
                            ? "año"
                            : "años"
                    }

                    restantes

                </span>

            </div>


            <button
                class="contribution-button"
                type="button"
                onclick="
                    abrirFormularioAportacion(
                        ${meta.id}
                    )
                "
            >

                <span class="button-plus">
                    +
                </span>

                Registrar aportación

            </button>


            <div
                id="aportacion-form-${meta.id}"
                class="contribution-form"
                hidden
            >

                <div class="contribution-form-title">

                    <span>
                        NUEVA APORTACIÓN
                    </span>

                    <small>
                        Se añadirá a tu dinero real registrado.
                    </small>

                </div>


                <div class="contribution-fields">


                    <div class="form-field">

                        <label
                            for="cantidad-${meta.id}"
                        >
                            Cantidad (€)
                        </label>


                        <input
                            id="cantidad-${meta.id}"
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="250"
                        >

                    </div>


                    <div class="form-field">

                        <label
                            for="fecha-${meta.id}"
                        >
                            Fecha
                        </label>


                        <input
                            id="fecha-${meta.id}"
                            type="date"
                            value="${fechaHoy()}"
                        >

                    </div>

                </div>


                <div class="contribution-actions">


                    <button
                        class="primary-button"
                        type="button"
                        onclick="
                            registrarAportacion(
                                ${meta.id}
                            )
                        "
                    >
                        Registrar
                    </button>


                    <button
                        class="text-button"
                        type="button"
                        onclick="
                            cerrarFormularioAportacion(
                                ${meta.id}
                            )
                        "
                    >
                        Cancelar
                    </button>


                </div>

            </div>


            <div class="goal-tools">

                <div class="goal-tool-info">

                    <span class="tool-label">
                        APORTACIONES
                    </span>

                    <strong>

                        ${registros}

                        ${
                            registros === 1
                                ? "registro"
                                : "registros"
                        }

                    </strong>

                </div>


                <button
                    class="link-action"
                    type="button"
                    onclick="
                        mostrarHistorial(
                            ${meta.id}
                        )
                    "
                >

                    Ver historial →

                </button>

            </div>


            <div class="simulation-box">


                <div class="simulation-box-header">

                    <div>

                        <span class="simulation-label">
                            SIMULACIÓN
                        </span>

                        <h4>
                            ¿Qué podría pasar?
                        </h4>

                    </div>


                    <span class="info-badge">
                        i
                    </span>

                </div>


                <p>

                    Si mantienes

                    <strong>
                        ${euros(
                            meta.mensual
                        )}/mes
                    </strong>

                    durante

                    <strong>
                        ${años}
                    </strong>

                    ${
                        años === 1
                            ? "año"
                            : "años"
                    }:

                </p>


                <div class="simulation-main">

                    <span>
                        Valor estimado
                    </span>

                    <strong>
                        ${euros(
                            sim.total
                        )}
                    </strong>

                </div>


                <div class="simulation-mini-grid">


                    <div>

                        <span>
                            Capital actual
                        </span>

                        <strong>
                            ${euros(
                                meta.ahorrado
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Aportaciones futuras
                        </span>

                        <strong>
                            ${euros(
                                sim.futuras
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Crecimiento hipotético
                        </span>

                        <strong>
                            +${euros(
                                sim.crecimiento
                            )}
                        </strong>

                    </div>


                </div>


                <small>

                    Hipótesis: 5% anual.
                    La inflación no está incluida.
                    No es una previsión ni una garantía.

                </small>


            </div>


            <div class="goal-actions">


                <button
                    class="action-button"
                    type="button"
                    onclick="
                        verDetalleMeta(
                            ${meta.id}
                        )
                    "
                >

                    <span>
                        ↗
                    </span>

                    Ver evolución

                </button>


                <button
                    class="action-button"
                    type="button"
                    onclick="
                        mostrarComparador(
                            ${meta.id}
                        )
                    "
                >

                    <span>
                        ⇄
                    </span>

                    Comparar

                </button>


            </div>


            <div class="goal-danger-zone">

                <button
                    class="delete-meta-button"
                    type="button"
                    onclick="
                        eliminarMeta(
                            ${meta.id}
                        )
                    "
                >

                    🗑

                    Eliminar meta

                </button>

            </div>


        </div>

    `;


    return tarjeta;

}


/* =========================================================
   APORTACIONES
========================================================= */

function abrirFormularioAportacion(
    id
) {

    const formulario =
        document.getElementById(
            `aportacion-form-${id}`
        );


    if (!formulario) {
        return;
    }


    formulario.hidden =
        !formulario.hidden;


    if (
        !formulario.hidden
    ) {

        document
            .getElementById(
                `cantidad-${id}`
            )
            ?.focus();

    }

}


function cerrarFormularioAportacion(
    id
) {

    const formulario =
        document.getElementById(
            `aportacion-form-${id}`
        );


    if (formulario) {

        formulario.hidden =
            true;

    }

}


function registrarAportacion(
    id
) {

    const meta =
        metas.find(
            elemento =>
                elemento.id === id
        );


    if (!meta) {
        return;
    }


    const cantidad =
        Number(
            document.getElementById(
                `cantidad-${id}`
            )?.value
        );


    const fecha =
        document.getElementById(
            `fecha-${id}`
        )?.value;


    if (
        !Number.isFinite(
            cantidad
        ) ||
        cantidad <= 0
    ) {

        alert(
            "Introduce una cantidad válida."
        );

        return;

    }


    if (!fecha) {

        alert(
            "Selecciona una fecha."
        );

        return;

    }


    if (
        !Array.isArray(
            meta.aportaciones
        )
    ) {

        meta.aportaciones =
            [];

    }


    meta.aportaciones.push({

        id:
            Date.now(),

        cantidad:
            redondear(
                cantidad
            ),

        fecha

    });


    meta.ahorrado =
        redondear(
            meta.aportaciones.reduce(
                (
                    total,
                    aportacion
                ) =>
                    total +
                    Number(
                        aportacion.cantidad || 0
                    ),
                0
            )
        );


    guardarMetas();

    actualizarTodo();

    mostrarToast(
        `Has registrado ${eurosExactos(cantidad)}`
    );

}


/* =========================================================
   HISTORIAL
========================================================= */

function mostrarHistorial(
    id
) {

    const meta =
        metas.find(
            elemento =>
                elemento.id === id
        );


    if (!meta) {
        return;
    }


    const aportaciones =
        [
            ...(meta.aportaciones || [])
        ]
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(
                        b.fecha
                    ) -
                    new Date(
                        a.fecha
                    )
            );


    abrirModal(
        "modalHistorial",
        `

        <div
            class="modal-overlay"
            data-close-modal
        ></div>


        <div class="modal-content modal-small">


            <button
                class="modal-close"
                type="button"
                data-close-modal
                aria-label="Cerrar"
            >
                ×
            </button>


            <p class="eyebrow">
                HISTORIAL
            </p>


            <h2>
                ${escapeHTML(
                    meta.nombre
                )}
            </h2>


            <p class="modal-intro">

                Aquí ves únicamente el dinero
                que has registrado.

            </p>


            <div class="history-total">

                <span>
                    Total registrado
                </span>

                <strong>
                    ${eurosExactos(
                        meta.ahorrado
                    )}
                </strong>

            </div>


            <div class="history-list">


                ${
                    aportaciones.length

                    ?

                    aportaciones
                        .map(
                            aportacion => `

                                <div class="history-row">


                                    <div class="history-main">

                                        <strong>

                                            +${eurosExactos(
                                                aportacion.cantidad
                                            )}

                                        </strong>


                                        <span>

                                            ${fechaBonita(
                                                aportacion.fecha
                                            )}

                                        </span>

                                    </div>


                                    <button
                                        class="history-delete"
                                        type="button"
                                        onclick="
                                            eliminarAportacion(
                                                ${meta.id},
                                                ${aportacion.id}
                                            )
                                        "
                                    >

                                        Eliminar

                                    </button>


                                </div>

                            `
                        )
                        .join("")

                    :

                    `

                        <div class="empty-history">

                            <p>
                                Todavía no has registrado
                                ninguna aportación.
                            </p>

                        </div>

                    `

                }


            </div>


        </div>

        `
    );

}


function eliminarAportacion(
    metaId,
    aportacionId
) {

    const meta =
        metas.find(
            elemento =>
                elemento.id === metaId
        );


    if (!meta) {
        return;
    }


    const confirmar =
        confirm(
            "¿Quieres eliminar esta aportación?"
        );


    if (!confirmar) {
        return;
    }


    meta.aportaciones =
        (
            meta.aportaciones ||
            []
        ).filter(
            aportacion =>
                aportacion.id !==
                aportacionId
        );


    meta.ahorrado =
        redondear(
            meta.aportaciones.reduce(
                (
                    total,
                    aportacion
                ) =>
                    total +
                    Number(
                        aportacion.cantidad || 0
                    ),
                0
            )
        );


    guardarMetas();

    cerrarTodosLosModales();

    actualizarTodo();

    mostrarHistorial(
        metaId
    );

}


/* =========================================================
   EVOLUCIÓN
========================================================= */

function verDetalleMeta(
    id
) {

    const meta =
        metas.find(
            elemento =>
                elemento.id === id
        );


    if (!meta) {
        return;
    }


    const simulacionMeta =
        simulacion(
            meta
        );


    const datosReales =
        [
            ...(meta.aportaciones || [])
        ]
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(
                        a.fecha
                    ) -
                    new Date(
                        b.fecha
                    )
            );


    abrirModal(
        "modalMeta",
        `

        <div
            class="modal-overlay"
            data-close-modal
        ></div>


        <div
            class="modal-content modal-large"
        >


            <button
                class="modal-close"
                type="button"
                data-close-modal
                aria-label="Cerrar"
            >
                ×
            </button>


            <p class="eyebrow">
                EVOLUCIÓN DE TU META
            </p>


            <h2>
                ${escapeHTML(
                    meta.nombre
                )}
            </h2>


            <p class="modal-intro">

                La línea continua representa tus
                aportaciones registradas.

                La línea discontinua muestra una
                proyección hipotética si mantienes
                tu aportación prevista.

            </p>


            <div class="modal-stats">


                <div>

                    <span>
                        Registrado
                    </span>

                    <strong>
                        ${euros(
                            meta.ahorrado
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Progreso
                    </span>

                    <strong>
                        ${progresoMeta(
                            meta
                        )}%
                    </strong>

                </div>


                <div>

                    <span>
                        Objetivo
                    </span>

                    <strong>
                        ${euros(
                            meta.objetivo
                        )}
                    </strong>

                </div>


            </div>


            <div class="evolution-chart-wrap">

                <canvas
                    id="graficaMeta"
                    width="900"
                    height="430"
                ></canvas>

            </div>


            <div class="chart-key">


                <span>

                    <i class="key-dot actual"></i>

                    Dinero registrado

                </span>


                <span>

                    <i class="key-dot projected"></i>

                    Proyección hipotética

                </span>


                <span>

                    <i class="key-line"></i>

                    Objetivo

                </span>


            </div>


            <div class="simulation-breakdown">


                <div>

                    <span>
                        Aportaciones futuras
                    </span>

                    <strong>
                        ${euros(
                            simulacionMeta.futuras
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Crecimiento hipotético
                    </span>

                    <strong>
                        +${euros(
                            simulacionMeta.crecimiento
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Valor estimado final
                    </span>

                    <strong>
                        ${euros(
                            simulacionMeta.total
                        )}
                    </strong>

                </div>


            </div>


            <p class="simulation-warning">

                Hipótesis utilizada: 5% de rentabilidad anual.
                La inflación no está incluida.
                El resultado es ilustrativo y no garantiza
                rentabilidades futuras.

            </p>


        </div>

        `
    );


    dibujarGraficaEvolucion(
        meta,
        datosReales
    );

}


/* =========================================================
   GRÁFICA EVOLUCIÓN
========================================================= */

function dibujarGraficaEvolucion(
    meta,
    reales
) {

    const canvas =
        document.getElementById(
            "graficaMeta"
        );


    if (!canvas) {
        return;
    }


    const ctx =
        canvas.getContext(
            "2d"
        );


    const width =
        canvas.width;


    const height =
        canvas.height;


    const left =
        65;


    const right =
        25;


    const top =
        30;


    const bottom =
        55;


    const plotWidth =
        width -
        left -
        right;


    const plotHeight =
        height -
        top -
        bottom;


    const years =
        Math.max(
            añosRestantes(
                meta
            ),
            1
        );


    const projection =
        Array.from(
            {
                length:
                    years + 1
            },
            (
                _,
                index
            ) => ({

                year:
                    AÑO_ACTUAL +
                    index,

                value:
                    valorFuturo(
                        meta.ahorrado,
                        meta.mensual,
                        index
                    )

            })
        );


    const maxValue =
        Math.max(
            meta.objetivo,
            meta.ahorrado,
            ...projection.map(
                punto =>
                    punto.value
            ),
            1
        );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    ctx.globalAlpha =
        0.1;


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            top +
            (
                plotHeight *
                i /
                4
            );


        ctx.beginPath();


        ctx.moveTo(
            left,
            y
        );


        ctx.lineTo(
            width -
            right,
            y
        );


        ctx.stroke();

    }


    ctx.globalAlpha =
        1;


    ctx.beginPath();

    ctx.moveTo(
        left,
        top
    );

    ctx.lineTo(
        left,
        height -
        bottom
    );

    ctx.lineTo(
        width -
        right,
        height -
        bottom
    );

    ctx.stroke();


    const yObjetivo =
        top +
        plotHeight -
        (
            meta.objetivo /
            maxValue
        ) *
        plotHeight;


    ctx.setLineDash([
        8,
        7
    ]);


    ctx.beginPath();

    ctx.moveTo(
        left,
        yObjetivo
    );

    ctx.lineTo(
        width -
        right,
        yObjetivo
    );

    ctx.stroke();


    ctx.setLineDash([]);


    ctx.setLineDash([
        5,
        5
    ]);


    ctx.beginPath();


    projection.forEach(
        (
            punto,
            index
        ) => {

            const x =
                left +
                (
                    index /
                    years
                ) *
                plotWidth;


            const y =
                top +
                plotHeight -
                (
                    punto.value /
                    maxValue
                ) *
                plotHeight;


            if (
                index === 0
            ) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );

            }

        }
    );


    ctx.stroke();


    ctx.setLineDash([]);


    if (
        reales.length
    ) {

        let acumulado =
            0;


        ctx.beginPath();


        reales.forEach(
            (
                aportacion,
                index
            ) => {

                acumulado +=
                    Number(
                        aportacion.cantidad
                    ) ||
                    0;


                const fecha =
                    new Date(
                        `${aportacion.fecha}T12:00:00`
                    );


                const año =
                    fecha.getFullYear();


                const distancia =
                    Math.min(
                        Math.max(
                            año -
                            AÑO_ACTUAL,
                            0
                        ),
                        years
                    );


                const x =
                    left +
                    (
                        distancia /
                        years
                    ) *
                    plotWidth;


                const y =
                    top +
                    plotHeight -
                    (
                        acumulado /
                        maxValue
                    ) *
                    plotHeight;


                if (
                    index === 0
                ) {

                    ctx.moveTo(
                        x,
                        y
                    );

                } else {

                    ctx.lineTo(
                        x,
                        y
                    );

                }

            }
        );


        ctx.stroke();

    }


    let acumulado =
        0;


    reales.forEach(
        aportacion => {

            acumulado +=
                Number(
                    aportacion.cantidad
                ) ||
                0;


            const fecha =
                new Date(
                    `${aportacion.fecha}T12:00:00`
                );


            const año =
                fecha.getFullYear();


            const distancia =
                Math.min(
                    Math.max(
                        año -
                        AÑO_ACTUAL,
                        0
                    ),
                    years
                );


            const x =
                left +
                (
                    distancia /
                    years
                ) *
                plotWidth;


            const y =
                top +
                plotHeight -
                (
                    acumulado /
                    maxValue
                ) *
                plotHeight;


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                5,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }
    );


    ctx.font =
        "13px Arial";


    ctx.textAlign =
        "center";


    projection.forEach(
        (
            punto,
            index
        ) => {

            const x =
                left +
                (
                    index /
                    years
                ) *
                plotWidth;


            ctx.fillText(
                punto.year,
                x,
                height -
                18
            );

        }
    );

}


/* =========================================================
   COMPARADOR
========================================================= */

function mostrarComparador(
    id
) {

    const meta =
        metas.find(
            elemento =>
                elemento.id === id
        );


    if (!meta) {
        return;
    }


    const años =
        añosRestantes(
            meta
        );


    const escenarios = [

        {
            titulo:
                "Aportación prevista",

            mensual:
                Number(
                    meta.mensual
                ) || 0
        },

        {
            titulo:
                "Aportar 50 € más",

            mensual:
                (
                    Number(
                        meta.mensual
                    ) || 0
                ) +
                50
        },

        {
            titulo:
                "Aportar 100 € más",

            mensual:
                (
                    Number(
                        meta.mensual
                    ) || 0
                ) +
                100
        }

    ];


    const tarjetas =
        escenarios
            .map(
                escenario => {

                    const resultado =
                        simulacion(
                            meta,
                            escenario.mensual
                        );


                    return `

                        <div class="comparison-card">

                            <span class="comparison-card-title">

                                ${escapeHTML(
                                    escenario.titulo
                                )}

                            </span>


                            <small>

                                ${euros(
                                    escenario.mensual
                                )}/mes

                            </small>


                            <strong>

                                ${euros(
                                    resultado.total
                                )}

                            </strong>


                            <p>

                                Valor simulado
                                al final del periodo.

                            </p>


                            <div class="comparison-detail">

                                <span>
                                    Aportaciones futuras
                                </span>

                                <b>
                                    ${euros(
                                        resultado.futuras
                                    )}
                                </b>

                            </div>


                            <div class="comparison-detail">

                                <span>
                                    Crecimiento hipotético
                                </span>

                                <b>
                                    +${euros(
                                        resultado.crecimiento
                                    )}
                                </b>

                            </div>


                        </div>

                    `;

                }
            )
            .join("");


    abrirModal(
        "modalComparador",
        `

        <div
            class="modal-overlay"
            data-close-modal
        ></div>


        <div
            class="modal-content modal-large"
        >


            <button
                class="modal-close"
                type="button"
                data-close-modal
                aria-label="Cerrar"
            >
                ×
            </button>


            <p class="eyebrow">
                COMPARAR
            </p>


            <h2>
                ¿Qué cambia si aportas más?
            </h2>


            <p class="modal-intro">

                ${escapeHTML(
                    meta.nombre
                )}

                ·

                ${años}

                ${
                    años === 1
                        ? "año"
                        : "años"
                }

                hasta el objetivo.

            </p>


            <div class="comparison-grid">

                ${tarjetas}

            </div>


            <div class="comparison-note">

                <strong>
                    ¿Qué estás comparando?
                </strong>


                <p>

                    El dinero que ya has registrado
                    se mantiene igual.

                    Solo cambia la aportación mensual
                    futura utilizada en cada simulación.

                </p>

            </div>


            <p class="simulation-warning">

                Hipótesis: 5% de rentabilidad anual.
                La inflación no está incluida.
                Los resultados son ilustrativos y no garantizan
                rentabilidades futuras.

            </p>


        </div>

        `
    );

}


/* =========================================================
   MODALES
========================================================= */

function abrirModal(
    id,
    html
) {

    cerrarModalPorId(
        id
    );


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        id;


    modal.className =
        "modal";


    modal.innerHTML =
        html;


    document.body.appendChild(
        modal
    );


    requestAnimationFrame(
        () => {

            modal.classList.add(
                "active"
            );

        }
    );


    modal
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            elemento => {

                elemento.addEventListener(
                    "click",
                    () => {

                        cerrarModalPorId(
                            id
                        );

                    }
                );

            }
        );

}


function cerrarModalPorId(
    id
) {

    const modal =
        document.getElementById(
            id
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "active"
    );


    setTimeout(
        () => {

            modal.remove();

        },
        250
    );

}


function cerrarTodosLosModales() {

    document
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            modal => {

                modal.classList.remove(
                    "active"
                );


                setTimeout(
                    () => {

                        modal.remove();

                    },
                    250
                );

            }
        );

}


/* =========================================================
   TOAST
========================================================= */

function mostrarToast(
    mensaje
) {

    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "toast-message";


    toast.textContent =
        mensaje;


    document.body.appendChild(
        toast
    );


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );

        }
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );


            setTimeout(
                () => {

                    toast.remove();

                },
                250
            );

        },
        2600
    );

}


/* =========================================================
   TU YO DEL FUTURO
========================================================= */

function actualizarYoDelFuturo() {

    const elemento =
        document.getElementById(
            "yoDelFuturo"
        );


    if (!elemento) {
        return;
    }


    if (!metas.length) {

        elemento.innerHTML = `

            <p class="future-message">

                Crea una meta para empezar
                a visualizar tu futuro financiero.

            </p>

        `;

        return;

    }


    const actual =
        metas.reduce(
            (
                total,
                meta
            ) =>
                total +
                Number(
                    meta.ahorrado ||
                    0
                ),
            0
        );


    const mensual =
        metas.reduce(
            (
                total,
                meta
            ) =>
                total +
                Number(
                    meta.mensual ||
                    0
                ),
            0
        );


    const futuro =
        valorFuturo(
            actual,
            mensual,
            10
        );


    const aportacionesFuturas =
        mensual *
        120;


    const crecimiento =
        Math.max(
            futuro -
            actual -
            aportacionesFuturas,
            0
        );


    elemento.innerHTML = `

        <p class="future-message">

            “Lo que haces hoy puede ampliar
            las opciones que tienes mañana.”

        </p>


        <div class="future-result">

            <span>
                Simulación a 10 años
            </span>


            <strong>
                ${euros(
                    futuro
                )}
            </strong>


            <small>

                Con tus aportaciones previstas,
                el crecimiento hipotético sería aproximadamente

                ${euros(
                    crecimiento
                )}.

            </small>

        </div>

    `;

}


/* =========================================================
   CÍRCULO
========================================================= */

function actualizarCirculo() {

    const contenedor =
        document.getElementById(
            "circuloContenido"
        );


    if (!contenedor) {
        return;
    }


    const total =
        circulo.reduce(
            (
                suma,
                persona
            ) =>
                suma +
                Number(
                    persona.aportado ||
                    0
                ),
            0
        );


    const progreso =
        Math.round(
            (
                total /
                CIRCULO_OBJETIVO
            ) *
            100
        );


    contenedor.innerHTML = `

        <div class="circle-header">


            <div class="avatars">


                ${circulo
                    .slice(
                        0,
                        4
                    )
                    .map(
                        persona => `

                            <span>

                                ${persona.nombre
                                    .charAt(
                                        0
                                    )
                                    .toUpperCase()}

                            </span>

                        `
                    )
                    .join("")}


                <span>

                    +${Math.max(
                        circulo.length -
                        4,
                        0
                    )}

                </span>


            </div>


            <div>

                <strong>
                    Viaje a Japón 🇯🇵
                </strong>


                <small>

                    Meta conjunta ·
                    ${euros(
                        CIRCULO_OBJETIVO
                    )}

                </small>

            </div>


        </div>



        <div class="circle-progress">

            <div
                style="
                    width:${Math.min(
                        progreso,
                        100
                    )}%
                "
            ></div>

        </div>



        <div class="circle-total">

            <div>

                <strong>
                    ${euros(total)}
                </strong>

                <span>
                    reunidos por el grupo
                </span>

            </div>


            <b>
                ${progreso}%
            </b>

        </div>



        <div class="friends">


            ${circulo
                .map(
                    persona => `

                        <div>

                            <div class="friend-name">

                                <span class="friend-avatar">

                                    ${persona.nombre
                                        .charAt(
                                            0
                                        )
                                        .toUpperCase()}

                                </span>

                                <span>

                                    ${escapeHTML(
                                        persona.nombre
                                    )}

                                </span>

                            </div>


                            <b>

                                ${euros(
                                    persona.aportado
                                )}

                            </b>

                        </div>

                    `
                )
                .join("")}


        </div>

    `;

}


/* =========================================================
   RESUMEN
========================================================= */

function actualizarResumen() {

    const dinero =
        metas.reduce(
            (
                total,
                meta
            ) =>
                total +
                Number(
                    meta.ahorrado ||
                    0
                ),
            0
        );


    const mensual =
        metas.reduce(
            (
                total,
                meta
            ) =>
                total +
                Number(
                    meta.mensual ||
                    0
                ),
            0
        );


    const objetivos =
        metas.reduce(
            (
                total,
                meta
            ) =>
                total +
                Number(
                    meta.objetivo ||
                    0
                ),
            0
        );


    const progreso =
        objetivos > 0
            ? Math.round(
                (
                    dinero /
                    objetivos
                ) *
                100
            )
            : 0;


    actualizarElemento(
        "patrimonioTotal",
        euros(
            dinero
        )
    );


    actualizarElemento(
        "aportacionTotal",
        euros(
            mensual
        )
    );


    actualizarElemento(
        "aportacionTotalResumen",
        euros(
            mensual
        )
    );


    actualizarElemento(
        "progresoTotal",
        `${progreso}%`
    );


    actualizarElemento(
        "numeroMetas",
        metas.length
    );


    actualizarElemento(
        "numeroMetasResumen",
        metas.length
    );

}


function actualizarElemento(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.textContent =
            valor;

    }

}


/* =========================================================
   GRÁFICA GENERAL
========================================================= */

function actualizarGraficaGeneral() {

    const canvas =
        document.getElementById(
            "graficaGeneral"
        );


    if (!canvas) {
        return;
    }


    const ctx =
        canvas.getContext(
            "2d"
        );


    const width =
        canvas.width;


    const height =
        canvas.height;


    const left =
        65;


    const right =
        30;


    const top =
        30;


    const bottom =
        50;


    const plotWidth =
        width -
        left -
        right;


    const plotHeight =
        height -
        top -
        bottom;


    const years =
        10;


    const datos =
        Array.from(
            {
                length:
                    years + 1
            },
            (
                _,
                index
            ) =>
                metas.reduce(
                    (
                        total,
                        meta
                    ) =>
                        total +
                        valorFuturo(
                            meta.ahorrado,
                            meta.mensual,
                            index
                        ),
                    0
                )
        );


    const max =
        Math.max(
            ...datos,
            1
        );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    ctx.globalAlpha =
        0.1;


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            top +
            (
                plotHeight *
                i /
                4
            );


        ctx.beginPath();


        ctx.moveTo(
            left,
            y
        );


        ctx.lineTo(
            width -
            right,
            y
        );


        ctx.stroke();

    }


    ctx.globalAlpha =
        1;


    ctx.beginPath();

    ctx.moveTo(
        left,
        top
    );

    ctx.lineTo(
        left,
        height -
        bottom
    );

    ctx.lineTo(
        width -
        right,
        height -
        bottom
    );

    ctx.stroke();


    ctx.beginPath();


    datos.forEach(
        (
            valor,
            index
        ) => {

            const x =
                left +
                (
                    index /
                    years
                ) *
                plotWidth;


            const y =
                top +
                plotHeight -
                (
                    valor /
                    max
                ) *
                plotHeight;


            if (
                index === 0
            ) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );

            }

        }
    );


    ctx.stroke();


    datos.forEach(
        (
            valor,
            index
        ) => {

            const x =
                left +
                (
                    index /
                    years
                ) *
                plotWidth;


            const y =
                top +
                plotHeight -
                (
                    valor /
                    max
                ) *
                plotHeight;


            ctx.beginPath();


            ctx.arc(
                x,
                y,
                4,
                0,
                Math.PI * 2
            );


            ctx.fill();

        }
    );


    ctx.font =
        "13px Arial";


    ctx.textAlign =
        "center";


    for (
        let i = 0;
        i <= years;
        i++
    ) {

        const x =
            left +
            (
                i /
                years
            ) *
            plotWidth;


        ctx.fillText(
            AÑO_ACTUAL +
            i,
            x,
            height -
            18
        );

    }

}


/* =========================================================
   ACTUALIZAR TODO
========================================================= */

function actualizarTodo() {

    renderizarMetas();

    actualizarResumen();

    actualizarGraficaGeneral();

    actualizarYoDelFuturo();

    actualizarCirculo();

}


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await comprobarSesion();

        actualizarTodo();

        document
            .getElementById(
                "profileButton"
            )
            ?.addEventListener(
                "click",
                abrirPerfil
            );


        document
            .getElementById(
                "authClose"
            )
            ?.addEventListener(
                "click",
                cerrarAuthModal
            );


        document
            .querySelector(
                "[data-auth-close]"
            )
            ?.addEventListener(
                "click",
                cerrarAuthModal
            );


        document
            .getElementById(
                "showRegister"
            )
            ?.addEventListener(
                "click",
                () =>
                    cambiarVistaAuth(
                        "register"
                    )
            );


        document
            .getElementById(
                "showLogin"
            )
            ?.addEventListener(
                "click",
                () =>
                    cambiarVistaAuth(
                        "login"
                    )
            );


        document
            .getElementById(
                "loginForm"
            )
            ?.addEventListener(
                "submit",
                iniciarSesion
            );


        document
            .getElementById(
                "registerForm"
            )
            ?.addEventListener(
                "submit",
                registrarUsuario
            );


        document
            .getElementById(
                "logoutButton"
            )
            ?.addEventListener(
                "click",
                cerrarSesion
            );


        document
            .getElementById(
                "nuevaMeta"
            )
            ?.addEventListener(
                "click",
                abrirFormularioNuevaMeta
            );


        document
            .getElementById(
                "crearMeta"
            )
            ?.addEventListener(
                "click",
                crearMeta
            );


        document
            .getElementById(
                "cancelarNuevaMeta"
            )
            ?.addEventListener(
                "click",
                cerrarFormularioNuevaMeta
            );


        [
            "nombreMeta",
            "objetivoMeta",
            "añoMeta",
            "mensualMeta"
        ]
            .forEach(
                id => {

                    document
                        .getElementById(
                            id
                        )
                        ?.addEventListener(
                            "keydown",
                            event => {

                                if (
                                    event.key ===
                                    "Enter"
                                ) {

                                    crearMeta();

                                }

                            }
                        );

                }
            );

    }
);


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            cerrarTodosLosModales();

        }

    }
);


/* =========================================================
   FUNCIONES GLOBALES
========================================================= */

window.crearMeta =
    crearMeta;

window.eliminarMeta =
    eliminarMeta;

window.registrarAportacion =
    registrarAportacion;

window.abrirFormularioAportacion =
    abrirFormularioAportacion;

window.cerrarFormularioAportacion =
    cerrarFormularioAportacion;

window.mostrarHistorial =
    mostrarHistorial;

window.eliminarAportacion =
    eliminarAportacion;

window.verDetalleMeta =
    verDetalleMeta;

window.mostrarComparador =
    mostrarComparador;

window.cerrarTodosLosModales =
    cerrarTodosLosModales;
