/* =========================================================
   HORIZONTE · script.js
   =========================================================

   Funcionalidades:

   - Creación de metas
   - Registro de aportaciones
   - Historial de aportaciones
   - Cálculo automático del progreso
   - Cálculo de años restantes
   - Simulación de crecimiento
   - Gráficas
   - Comparación de aportaciones
   - Tu yo del futuro
   - Mi Círculo
   - Guardado de datos en el navegador

   NOTA:
   Las rentabilidades utilizadas son hipotéticas.
   No representan rentabilidades garantizadas.
   ========================================================= */


/* =========================================================
   1. CONFIGURACIÓN
   ========================================================= */

const RENTABILIDAD_SIMULADA = 0.05;

const AÑO_ACTUAL =
    new Date().getFullYear();

const STORAGE_KEY =
    "horizonte_metas_v2";


/* =========================================================
   2. METAS INICIALES
   ========================================================= */

const metasIniciales = [

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


/* =========================================================
   3. CARGAR METAS
   ========================================================= */

function cargarMetas() {

    try {

        const datosGuardados =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!datosGuardados) {

            return copiarDatosIniciales();

        }


        const datos =
            JSON.parse(
                datosGuardados
            );


        if (
            !Array.isArray(datos)
        ) {

            return copiarDatosIniciales();

        }


        return datos;

    } catch (error) {

        console.error(
            "No se pudieron cargar las metas:",
            error
        );

        return copiarDatosIniciales();

    }

}


/* =========================================================
   4. COPIA DE DATOS INICIALES
   ========================================================= */

function copiarDatosIniciales() {

    return JSON.parse(
        JSON.stringify(
            metasIniciales
        )
    );

}


/* =========================================================
   5. GUARDAR METAS
   ========================================================= */

function guardarMetas() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(metas)
        );

    } catch (error) {

        console.error(
            "No se pudieron guardar las metas:",
            error
        );

    }

}


/* =========================================================
   6. VARIABLE PRINCIPAL
   ========================================================= */

let metas =
    cargarMetas();


/* =========================================================
   7. DATOS DEL CÍRCULO
   ========================================================= */

const circulo = [

    {
        nombre: "Andrea",
        meta: "Viaje a Japón 🇯🇵",
        aportado: 3240
    },

    {
        nombre: "Lucía",
        meta: "Viaje a Japón 🇯🇵",
        aportado: 2800
    },

    {
        nombre: "Carlos",
        meta: "Viaje a Japón 🇯🇵",
        aportado: 2100
    },

    {
        nombre: "Tú",
        meta: "Viaje a Japón 🇯🇵",
        aportado: 1650
    },

    {
        nombre: "María",
        meta: "Viaje a Japón 🇯🇵",
        aportado: 650
    }

];


const CIRCULO_OBJETIVO =
    18000;


/* =========================================================
   8. FUNCIONES MATEMÁTICAS
   ========================================================= */


/**
 * Calcula el porcentaje de progreso.
 */
function calcularProgreso(
    ahorrado,
    objetivo
) {

    if (
        !objetivo ||
        objetivo <= 0
    ) {

        return 0;

    }


    return Math.min(
        Math.round(
            (
                ahorrado /
                objetivo
            ) * 100
        ),
        100
    );

}


/**
 * Calcula los años restantes.
 */
function calcularAñosRestantes(
    añoObjetivo
) {

    return Math.max(
        añoObjetivo -
        AÑO_ACTUAL,
        0
    );

}


/**
 * Calcula el valor futuro.
 */
function calcularValorFuturo(
    capitalInicial,
    aportacionMensual,
    años,
    rentabilidadAnual =
        RENTABILIDAD_SIMULADA
) {

    if (
        años <= 0
    ) {

        return capitalInicial;

    }


    const meses =
        Math.round(
            años * 12
        );


    const rentabilidadMensual =
        rentabilidadAnual /
        12;


    let valor =
        Number(
            capitalInicial
        ) || 0;


    for (
        let i = 0;
        i < meses;
        i++
    ) {

        valor =
            valor *
            (
                1 +
                rentabilidadMensual
            );


        valor +=
            Number(
                aportacionMensual
            ) || 0;

    }


    return valor;

}


/**
 * Formatea euros.
 */
function formatearEuros(
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


/**
 * Formatea fecha.
 */
function formatearFecha(
    fecha
) {

    if (!fecha) {
        return "";
    }


    const fechaObj =
        new Date(
            `${fecha}T12:00:00`
        );


    if (
        Number.isNaN(
            fechaObj.getTime()
        )
    ) {

        return fecha;

    }


    return new Intl.DateTimeFormat(
        "es-ES"
    ).format(
        fechaObj
    );

}


/* =========================================================
   9. SEGURIDAD
   ========================================================= */

function escapeHTML(
    texto
) {

    return String(texto)

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
   10. ICONO DE META
   ========================================================= */

function obtenerIconoMeta(
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


/* =========================================================
   11. DESCRIPCIÓN
   ========================================================= */

function generarDescripcionMeta(
    meta
) {

    const nombre =
        meta.nombre.toLowerCase();


    if (
        nombre.includes("casa") ||
        nombre.includes("vivienda")
    ) {

        return "Entrada para una vivienda";

    }


    if (
        nombre.includes("viaje") ||
        nombre.includes("japón") ||
        nombre.includes("japon")
    ) {

        return "Un proyecto para disfrutar y explorar";

    }


    if (
        nombre.includes("independencia")
    ) {

        return "Construir un colchón financiero";

    }


    return "Un objetivo pensado para tu futuro";

}


/* =========================================================
   12. CREAR META
   ========================================================= */

function crearMeta() {

    const nombreInput =
        document.getElementById(
            "nombreMeta"
        );


    const objetivoInput =
        document.getElementById(
            "objetivoMeta"
        );


    const añoInput =
        document.getElementById(
            "añoMeta"
        );


    const mensualInput =
        document.getElementById(
            "mensualMeta"
        );


    if (
        !nombreInput ||
        !objetivoInput ||
        !añoInput ||
        !mensualInput
    ) {

        return;

    }


    const nombre =
        nombreInput.value.trim();


    const objetivo =
        Number(
            objetivoInput.value
        );


    const año =
        Number(
            añoInput.value
        );


    const mensual =
        Number(
            mensualInput.value
        );


    if (!nombre) {

        alert(
            "Ponle un nombre a tu meta."
        );

        return;

    }


    if (
        !objetivo ||
        objetivo <= 0
    ) {

        alert(
            "Introduce un objetivo válido."
        );

        return;

    }


    if (
        !año ||
        año <= AÑO_ACTUAL
    ) {

        alert(
            `El año objetivo debe ser posterior a ${AÑO_ACTUAL}.`
        );

        return;

    }


    if (
        mensual < 0
    ) {

        alert(
            "La aportación mensual no puede ser negativa."
        );

        return;

    }


    const nuevaMeta = {

        id: Date.now(),

        nombre,

        objetivo,

        ahorrado: 0,

        año,

        mensual,

        aportaciones: []

    };


    metas.push(
        nuevaMeta
    );


    guardarMetas();


    renderizarMetas();

    actualizarResumen();

    actualizarGraficaGeneral();

    actualizarYoDelFuturo();


    nombreInput.value = "";

    objetivoInput.value = "";

    añoInput.value = "";

    mensualInput.value = "";


    const formulario =
        document.getElementById(
            "formularioMeta"
        );


    if (formulario) {

        formulario.style.display =
            "none";

    }

}


/* =========================================================
   13. ELIMINAR META
   ========================================================= */

function eliminarMeta(
    id
) {

    const confirmar =
        confirm(
            "¿Seguro que quieres eliminar esta meta y su historial de aportaciones?"
        );


    if (!confirmar) {
        return;
    }


    metas =
        metas.filter(
            meta =>
                meta.id !== id
        );


    guardarMetas();


    renderizarMetas();

    actualizarResumen();

    actualizarGraficaGeneral();

    actualizarYoDelFuturo();

}


/* =========================================================
   14. RENDERIZAR METAS
   ========================================================= */

function renderizarMetas() {

    const contenedor =
        document.getElementById(
            "listaMetas"
        );


    if (!contenedor) {
        return;
    }


    contenedor.innerHTML = "";


    if (
        metas.length === 0
    ) {

        contenedor.innerHTML = `

            <div class="empty-state">

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


/* =========================================================
   15. CREAR TARJETA DE META
   ========================================================= */

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
        calcularProgreso(
            meta.ahorrado,
            meta.objetivo
        );


    const añosRestantes =
        calcularAñosRestantes(
            meta.año
        );


    const valorFuturo =
        calcularValorFuturo(
            meta.ahorrado,
            meta.mensual,
            añosRestantes
        );


    const aportaciones =
        Array.isArray(
            meta.aportaciones
        )
            ? meta.aportaciones
            : [];


    tarjeta.innerHTML = `

        <div class="goal-icon">
            ${obtenerIconoMeta(meta.nombre)}
        </div>


        <div class="goal-content">

            <div class="goal-title">

                <h3>
                    ${escapeHTML(meta.nombre)}
                </h3>

                <span>
                    ${meta.año}
                </span>

            </div>


            <p>
                ${generarDescripcionMeta(meta)}
            </p>


            <div class="progress-info">

                <span>
                    ${formatearEuros(meta.ahorrado)}
                    de
                    ${formatearEuros(meta.objetivo)}
                </span>

                <strong>
                    ${progreso}%
                </strong>

            </div>


            <div class="progress-bar">

                <div
                    style="width:${progreso}%"
                ></div>

            </div>


            <div class="goal-footer">

                <span>
                    ${formatearEuros(meta.mensual)}/mes
                </span>

                <span>
                    ${añosRestantes}
                    ${añosRestantes === 1 ? "año" : "años"}
                    restantes
                </span>

            </div>


            <!-- =========================
                 REGISTRAR APORTACIÓN
            ========================== -->

            <button
                class="primary-button contribution-button"
                type="button"
                onclick="abrirFormularioAportacion(${meta.id})"
            >
                + Registrar aportación
            </button>


            <!-- =========================
                 HISTORIAL
            ========================== -->

            <div class="contribution-summary">

                <span>
                    ${aportaciones.length}
                    ${aportaciones.length === 1
                        ? "aportación registrada"
                        : "aportaciones registradas"}
                </span>

                <button
                    class="history-button"
                    type="button"
                    onclick="mostrarHistorial(${meta.id})"
                >
                    Ver historial →
                </button>

            </div>


            <!-- =========================
                 FORMULARIO APORTACIÓN
            ========================== -->

            <div
                id="aportacion-form-${meta.id}"
                class="contribution-form"
                style="display:none;"
            >

                <div class="form-field">

                    <label for="cantidad-${meta.id}">
                        ¿Cuánto has aportado?
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

                    <label for="fecha-${meta.id}">
                        Fecha
                    </label>

                    <input
                        id="fecha-${meta.id}"
                        type="date"
                        value="${obtenerFechaHoy()}"
                    >

                </div>


                <div class="contribution-actions">

                    <button
                        class="primary-button"
                        type="button"
                        onclick="registrarAportacion(${meta.id})"
                    >
                        Registrar
                    </button>

                    <button
                        class="secondary-button"
                        type="button"
                        onclick="cerrarFormularioAportacion(${meta.id})"
                    >
                        Cancelar
                    </button>

                </div>

            </div>


            <!-- =========================
                 SIMULACIÓN
            ========================== -->

            <div class="future-value">

                <span>
                    Simulación orientativa
                </span>

                <strong>
                    ${formatearEuros(valorFuturo)}
                </strong>

                <small>
                    Si mantuvieras una aportación de
                    ${formatearEuros(meta.mensual)}/mes
                    con una rentabilidad hipotética
                    del 5% anual.
                    No garantiza rentabilidad.
                </small>

            </div>


            <!-- =========================
                 ACCIONES
            ========================== -->

            <div class="goal-actions">

                <button
                    class="secondary-button"
                    type="button"
                    onclick="verDetalleMeta(${meta.id})"
                >
                    Ver evolución
                </button>


                <button
                    class="secondary-button"
                    type="button"
                    onclick="mostrarComparador(${meta.id})"
                >
                    Comparar
                </button>


                <button
                    class="delete-button"
                    type="button"
                    onclick="eliminarMeta(${meta.id})"
                >
                    Eliminar
                </button>

            </div>

        </div>

    `;


    return tarjeta;
}


/* =========================================================
   16. FECHA DE HOY
   ========================================================= */

function obtenerFechaHoy() {

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


    return `${año}-${mes}-${dia}`;

}


/* =========================================================
   17. ABRIR FORMULARIO DE APORTACIÓN
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


    formulario.style.display =
        formulario.style.display === "none"
            ? "block"
            : "none";


    if (
        formulario.style.display === "block"
    ) {

        const input =
            document.getElementById(
                `cantidad-${id}`
            );


        if (input) {
            input.focus();
        }

    }

}


/* =========================================================
   18. CERRAR FORMULARIO
   ========================================================= */

function cerrarFormularioAportacion(
    id
) {

    const formulario =
        document.getElementById(
            `aportacion-form-${id}`
        );


    if (formulario) {

        formulario.style.display =
            "none";

    }

}


/* =========================================================
   19. REGISTRAR APORTACIÓN
   ========================================================= */

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


    const cantidadInput =
        document.getElementById(
            `cantidad-${id}`
        );


    const fechaInput =
        document.getElementById(
            `fecha-${id}`
        );


    if (
        !cantidadInput ||
        !fechaInput
    ) {

        return;

    }


    const cantidad =
        Number(
            cantidadInput.value
        );


    const fecha =
        fechaInput.value;


    if (
        !cantidad ||
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

        meta.aportaciones = [];

    }


    const aportacion = {

        id: Date.now(),

        cantidad,

        fecha

    };


    meta.aportaciones.push(
        aportacion
    );


    meta.ahorrado =
        meta.aportaciones.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.cantidad
                ),
            0
        );


    meta.ahorrado =
        Math.round(
            meta.ahorrado *
            100
        ) / 100;


    guardarMetas();


    renderizarMetas();

    actualizarResumen();

    actualizarGraficaGeneral();

    actualizarYoDelFuturo();


    const nuevaTarjeta =
        document.querySelector(
            `[onclick="abrirFormularioAportacion(${id})"]`
        );


    if (nuevaTarjeta) {

        nuevaTarjeta.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }


    mostrarMensajeAportacion(
        cantidad
    );

}


/* =========================================================
   20. MENSAJE DESPUÉS DE APORTAR
   ========================================================= */

function mostrarMensajeAportacion(
    cantidad
) {

    const mensaje =
        document.createElement(
            "div"
        );


    mensaje.className =
        "success-message";


    mensaje.textContent =
        `Aportación de ${formatearEuros(cantidad)} registrada correctamente.`;



    document.body.appendChild(
        mensaje
    );


    setTimeout(
        () => {

            mensaje.classList.add(
                "show"
            );

        },
        10
    );


    setTimeout(
        () => {

            mensaje.classList.remove(
                "show"
            );


            setTimeout(
                () => {

                    mensaje.remove();

                },
                300
            );

        },
        3000
    );

}


/* =========================================================
   21. HISTORIAL DE APORTACIONES
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
        Array.isArray(
            meta.aportaciones
        )
            ? [...meta.aportaciones]
            : [];


    aportaciones.sort(
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


    let modal =
        document.getElementById(
            "modalHistorial"
        );


    if (!modal) {

        modal =
            document.createElement(
                "div"
            );


        modal.id =
            "modalHistorial";


        modal.className =
            "modal";


        document.body.appendChild(
            modal
        );

    }


    modal.innerHTML = `

        <div
            class="modal-overlay"
            onclick="cerrarHistorial()"
        ></div>


        <div class="modal-content">

            <button
                class="modal-close"
                type="button"
                onclick="cerrarHistorial()"
            >
                ×
            </button>


            <p class="eyebrow">
                HISTORIAL
            </p>


            <h2>
                ${escapeHTML(meta.nombre)}
            </h2>


            <p>
                Todo lo que has registrado en esta meta.
            </p>


            <div class="history-total">

                <span>
                    Total acumulado
                </span>

                <strong>
                    ${formatearEuros(
                        meta.ahorrado
                    )}
                </strong>

            </div>


            <div class="history-list">

                ${
                    aportaciones.length === 0

                        ? `

                            <div class="empty-history">

                                <p>
                                    Todavía no has registrado
                                    ninguna aportación.
                                </p>

                            </div>

                          `

                        : aportaciones
                            .map(
                                aportacion => `

                                    <div class="history-row">

                                        <div>

                                            <strong>
                                                +${formatearEuros(
                                                    aportacion.cantidad
                                                )}
                                            </strong>

                                            <span>
                                                ${formatearFecha(
                                                    aportacion.fecha
                                                )}
                                            </span>

                                        </div>

                                        <button
                                            class="history-delete"
                                            type="button"
                                            onclick="eliminarAportacion(
                                                ${meta.id},
                                                ${aportacion.id}
                                            )"
                                        >
                                            Eliminar
                                        </button>

                                    </div>

                                `
                            )
                            .join("")
                }

            </div>

        </div>

    `;


    modal.classList.add(
        "active"
    );

}


/* =========================================================
   22. CERRAR HISTORIAL
   ========================================================= */

function cerrarHistorial() {

    const modal =
        document.getElementById(
            "modalHistorial"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   23. ELIMINAR UNA APORTACIÓN
   ========================================================= */

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
        meta.aportaciones.filter(
            aportacion =>
                aportacion.id !==
                aportacionId
        );


    meta.ahorrado =
        meta.aportaciones.reduce(
            (
                total,
                aportacion
            ) =>
                total +
                Number(
                    aportacion.cantidad
                ),
            0
        );


    guardarMetas();


    cerrarHistorial();


    renderizarMetas();

    actualizarResumen();

    actualizarGraficaGeneral();

    actualizarYoDelFuturo();


    mostrarHistorial(
        metaId
    );

}


/* =========================================================
   24. VER EVOLUCIÓN
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


    const datos =
        generarDatosEvolucion(
            meta
        );


    mostrarModalMeta(
        meta,
        datos
    );

}


/* =========================================================
   25. DATOS PARA GRÁFICA DE META
   ========================================================= */

function generarDatosEvolucion(
    meta
) {

    const añosRestantes =
        calcularAñosRestantes(
            meta.año
        );


    const datos = [];

    let capital =
        meta.ahorrado;


    for (
        let i = 0;
        i <= añosRestantes;
        i++
    ) {

        datos.push({

            año:
                AÑO_ACTUAL + i,

            valor:
                capital

        });


        capital =
            calcularValorFuturo(
                capital,
                meta.mensual,
                1
            );

    }


    return datos;

}


/* =========================================================
   26. MODAL DE EVOLUCIÓN
   ========================================================= */

function mostrarModalMeta(
    meta,
    datos
) {

    let modal =
        document.getElementById(
            "modalMeta"
        );


    if (!modal) {

        modal =
            document.createElement(
                "div"
            );


        modal.id =
            "modalMeta";


        modal.className =
            "modal";


        document.body.appendChild(
            modal
        );

    }


    const valorFinal =
        datos.length
            ? datos[
                datos.length - 1
              ].valor
            : meta.ahorrado;


    const progreso =
        calcularProgreso(
            meta.ahorrado,
            meta.objetivo
        );


    modal.innerHTML = `

        <div
            class="modal-overlay"
            onclick="cerrarModalMeta()"
        ></div>


        <div class="modal-content">

            <button
                class="modal-close"
                type="button"
                onclick="cerrarModalMeta()"
            >
                ×
            </button>


            <p class="eyebrow">
                EVOLUCIÓN
            </p>


            <h2>
                ${escapeHTML(meta.nombre)}
            </h2>


            <p>
                Tu progreso actual y una simulación de su posible evolución.
            </p>


            <div class="modal-stats">

                <div>

                    <span>
                        Actualmente
                    </span>

                    <strong>
                        ${formatearEuros(meta.ahorrado)}
                    </strong>

                </div>


                <div>

                    <span>
                        Progreso
                    </span>

                    <strong>
                        ${progreso}%
                    </strong>

                </div>


                <div>

                    <span>
                        Simulación final
                    </span>

                    <strong>
                        ${formatearEuros(valorFinal)}
                    </strong>

                </div>

            </div>


            <div class="chart-container">

                <canvas
                    id="graficaMeta"
                    width="800"
                    height="400"
                ></canvas>

            </div>


            <p class="simulation-warning">

                Simulación orientativa con una rentabilidad
                hipotética del 5% anual.
                No garantiza rentabilidad futura.

            </p>

        </div>

    `;


    modal.classList.add(
        "active"
    );


    dibujarGraficaMeta(
        datos,
        meta
    );

}


/* =========================================================
   27. CERRAR MODAL
   ========================================================= */

function cerrarModalMeta() {

    const modal =
        document.getElementById(
            "modalMeta"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   28. GRÁFICA DE META
   ========================================================= */

function dibujarGraficaMeta(
    datos,
    meta
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


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    if (!datos.length) {
        return;
    }


    const margen = 55;


    const anchoGrafica =
        width -
        margen * 2;


    const altoGrafica =
        height -
        margen * 2;


    const maxValor =
        Math.max(
            meta.objetivo,
            ...datos.map(
                dato =>
                    dato.valor
            ),
            1
        );


    /* Ejes */

    ctx.beginPath();

    ctx.moveTo(
        margen,
        margen
    );

    ctx.lineTo(
        margen,
        height -
        margen
    );

    ctx.lineTo(
        width -
        margen,
        height -
        margen
    );

    ctx.stroke();


    /* Objetivo */

    const yObjetivo =
        height -
        margen -
        (
            meta.objetivo /
            maxValor
        ) *
        altoGrafica;


    ctx.setLineDash([
        8,
        6
    ]);


    ctx.beginPath();

    ctx.moveTo(
        margen,
        yObjetivo
    );

    ctx.lineTo(
        width -
        margen,
        yObjetivo
    );

    ctx.stroke();


    ctx.setLineDash([]);


    /* Evolución */

    ctx.beginPath();


    datos.forEach(
        (
            dato,
            index
        ) => {

            const x =
                margen +
                (
                    index /
                    (
                        datos.length -
                        1 ||
                        1
                    )
                ) *
                anchoGrafica;


            const y =
                height -
                margen -
                (
                    dato.valor /
                    maxValor
                ) *
                altoGrafica;


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


    /* Puntos */

    datos.forEach(
        (
            dato,
            index
        ) => {

            const x =
                margen +
                (
                    index /
                    (
                        datos.length -
                        1 ||
                        1
                    )
                ) *
                anchoGrafica;


            const y =
                height -
                margen -
                (
                    dato.valor /
                    maxValor
                ) *
                altoGrafica;


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


    /* Años */

    ctx.font =
        "13px Arial";


    ctx.textAlign =
        "center";


    datos.forEach(
        (
            dato,
            index
        ) => {

            const x =
                margen +
                (
                    index /
                    (
                        datos.length -
                        1 ||
                        1
                    )
                ) *
                anchoGrafica;


            ctx.fillText(
                dato.año,
                x,
                height -
                20
            );

        }
    );

}


/* =========================================================
   29. ACTUALIZAR RESUMEN
   ========================================================= */

function actualizarResumen() {

    const patrimonio =
        metas.reduce(
            (
                total,
                meta
            ) =>
                total +
                Number(
                    meta.ahorrado
                ),
            0
        );


    const aportacionMensual =
        metas.reduce(
            (
                total,
                meta
            ) =>
                total +
                Number(
                    meta.mensual
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
                    meta.objetivo
                ),
            0
        );


    const progresoGeneral =
        objetivos > 0
            ? Math.round(
                (
                    patrimonio /
                    objetivos
                ) * 100
            )
            : 0;


    actualizarElemento(
        "patrimonioTotal",
        formatearEuros(
            patrimonio
        )
    );


    actualizarElemento(
        "aportacionTotal",
        formatearEuros(
            aportacionMensual
        )
    );


    actualizarElemento(
        "aportacionTotalResumen",
        formatearEuros(
            aportacionMensual
        )
    );


    actualizarElemento(
        "progresoTotal",
        `${progresoGeneral}%`
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


/* =========================================================
   30. ACTUALIZAR ELEMENTO
   ========================================================= */

function actualizarElemento(
    id,
    contenido
) {

    const elemento =
        document.getElementById(
            id
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        contenido;

}


/* =========================================================
   31. GRÁFICA GENERAL
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


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    if (!metas.length) {
        return;
    }


    const años =
        10;


    const datos = [];


    for (
        let año = 0;
        año <= años;
        año++
    ) {

        let total = 0;


        metas.forEach(
            meta => {

                total +=
                    calcularValorFuturo(
                        meta.ahorrado,
                        meta.mensual,
                        año
                    );

            }
        );


        datos.push(
            total
        );

    }


    const margen = 55;


    const ancho =
        width -
        margen * 2;


    const alto =
        height -
        margen * 2;


    const maxValor =
        Math.max(
            ...datos,
            1
        );


    /* Ejes */

    ctx.beginPath();

    ctx.moveTo(
        margen,
        margen
    );

    ctx.lineTo(
        margen,
        height -
        margen
    );

    ctx.lineTo(
        width -
        margen,
        height -
        margen
    );

    ctx.stroke();


    /* Línea */

    ctx.beginPath();


    datos.forEach(
        (
            valor,
            index
        ) => {

            const x =
                margen +
                (
                    index /
                    años
                ) *
                ancho;


            const y =
                height -
                margen -
                (
                    valor /
                    maxValor
                ) *
                alto;


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


    /* Puntos */

    datos.forEach(
        (
            valor,
            index
        ) => {

            const x =
                margen +
                (
                    index /
                    años
                ) *
                ancho;


            const y =
                height -
                margen -
                (
                    valor /
                    maxValor
                ) *
                alto;


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


    /* Años */

    ctx.font =
        "13px Arial";


    ctx.textAlign =
        "center";


    datos.forEach(
        (
            valor,
            index
        ) => {

            const x =
                margen +
                (
                    index /
                    años
                ) *
                ancho;


            ctx.fillText(
                AÑO_ACTUAL +
                index,
                x,
                height -
                20
            );

        }
    );

}


/* =========================================================
   32. COMPARADOR
   ========================================================= */

function calcularEscenarios(
    meta
) {

    const años =
        calcularAñosRestantes(
            meta.año
        );


    const escenarios = [

        {
            nombre: "Actual",

            mensual:
                meta.mensual
        },

        {
            nombre: "+50 €/mes",

            mensual:
                meta.mensual +
                50
        },

        {
            nombre: "+100 €/mes",

            mensual:
                meta.mensual +
                100
        }

    ];


    return escenarios.map(
        escenario => {

            const valor =
                calcularValorFuturo(
                    meta.ahorrado,
                    escenario.mensual,
                    años
                );


            return {

                ...escenario,

                valor

            };

        }
    );

}


/* =========================================================
   33. MOSTRAR COMPARADOR
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


    const escenarios =
        calcularEscenarios(
            meta
        );


    let contenedor =
        document.getElementById(
            "comparador"
        );


    if (!contenedor) {

        contenedor =
            document.createElement(
                "div"
            );


        contenedor.id =
            "comparador";


        contenedor.className =
            "comparison-container";


        const metasSection =
            document.getElementById(
                "metas"
            );


        if (metasSection) {

            metasSection.appendChild(
                contenedor
            );

        } else {

            document.body.appendChild(
                contenedor
            );

        }

    }


    contenedor.innerHTML = `

        <div class="comparison-header">

            <div>

                <p class="eyebrow">
                    COMPARADOR
                </p>

                <h3>
                    ¿Qué pasa si aumentas
                    tu aportación?
                </h3>

                <p>
                    ${escapeHTML(meta.nombre)}
                </p>

            </div>

        </div>


        <div class="comparison-grid">

            ${escenarios
                .map(
                    escenario => `

                        <div class="comparison-card">

                            <span>
                                ${escenario.nombre}
                            </span>

                            <strong>
                                ${formatearEuros(
                                    escenario.valor
                                )}
                            </strong>

                            <small>
                                ${formatearEuros(
                                    escenario.mensual
                                )}/mes
                            </small>

                        </div>

                    `
                )
                .join("")}

        </div>


        <small class="simulation-warning">

            Simulación orientativa al 5% anual.
            No garantiza rentabilidad.

        </small>

    `;


    contenedor.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =========================================================
   34. TU YO DEL FUTURO
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


    const totalActual =
        metas.reduce(
            (
                total,
                meta
            ) =>
                total +
                Number(
                    meta.ahorrado
                ),
            0
        );


    const totalMensual =
        metas.reduce(
            (
                total,
                meta
            ) =>
                total +
                Number(
                    meta.mensual
                ),
            0
        );


    const valorFuturo =
        calcularValorFuturo(
            totalActual,
            totalMensual,
            10
        );


    elemento.innerHTML = `

        <p class="future-message">

            “Lo que haces hoy puede cambiar
            la cantidad de opciones que tienes mañana.”

        </p>


        <div class="future-result">

            <span>
                En 10 años
            </span>

            <strong>
                ${formatearEuros(
                    valorFuturo
                )}
            </strong>

            <small>
                Simulación hipotética manteniendo
                tus aportaciones previstas y una
                rentabilidad del 5% anual.
            </small>

        </div>

    `;

}


/* =========================================================
   35. MI CÍRCULO
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
                    persona.aportado
                ),
            0
        );


    const progreso =
        Math.round(
            (
                total /
                CIRCULO_OBJETIVO
            ) * 100
        );


    contenedor.innerHTML = `

        <div class="circle-header">

            <div class="avatars">

                ${circulo
                    .slice(0, 4)
                    .map(
                        persona => `
                            <span>
                                ${persona.nombre
                                    .charAt(0)
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
                    ${formatearEuros(
                        CIRCULO_OBJETIVO
                    )}
                </small>

            </div>

        </div>


        <div class="circle-progress">

            <div
                style="width:${Math.min(
                    progreso,
                    100
                )}%"
            ></div>

        </div>


        <div class="circle-total">

            <strong>
                ${formatearEuros(total)}
            </strong>

            <span>
                ${progreso}% conseguido
            </span>

        </div>


        <div class="friends">

            ${circulo
                .map(
                    persona => `

                        <div>

                            <span>
                                ${escapeHTML(
                                    persona.nombre
                                )}
                            </span>

                            <b>
                                ${formatearEuros(
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
   36. BOTÓN NUEVA META
   ========================================================= */

function configurarBotonNuevaMeta() {

    const boton =
        document.getElementById(
            "nuevaMeta"
        );


    const formulario =
        document.getElementById(
            "formularioMeta"
        );


    if (
        !boton ||
        !formulario
    ) {
        return;
    }


    boton.addEventListener(
        "click",
        () => {

            const oculto =
                formulario.style.display ===
                "none";


            formulario.style.display =
                oculto
                    ? "block"
                    : "none";


            if (oculto) {

                formulario.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

        }
    );

}


/* =========================================================
   37. FORMULARIO DE META
   ========================================================= */

function configurarFormulario() {

    const boton =
        document.getElementById(
            "crearMeta"
        );


    if (!boton) {
        return;
    }


    boton.addEventListener(
        "click",
        crearMeta
    );


    const inputs = [

        document.getElementById(
            "nombreMeta"
        ),

        document.getElementById(
            "objetivoMeta"
        ),

        document.getElementById(
            "añoMeta"
        ),

        document.getElementById(
            "mensualMeta"
        )

    ];


    inputs.forEach(
        input => {

            if (!input) {
                return;
            }


            input.addEventListener(
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


/* =========================================================
   38. ESC PARA CERRAR MODALES
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            cerrarModalMeta();

            cerrarHistorial();

        }

    }
);


/* =========================================================
   39. INICIAR APLICACIÓN
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderizarMetas();

        actualizarResumen();

        actualizarGraficaGeneral();

        actualizarYoDelFuturo();

        actualizarCirculo();

        configurarBotonNuevaMeta();

        configurarFormulario();

    }
);


/* =========================================================
   40. FUNCIONES DISPONIBLES PARA HTML
   ========================================================= */

window.crearMeta =
    crearMeta;


window.eliminarMeta =
    eliminarMeta;


window.verDetalleMeta =
    verDetalleMeta;


window.cerrarModalMeta =
    cerrarModalMeta;


window.mostrarComparador =
    mostrarComparador;


window.abrirFormularioAportacion =
    abrirFormularioAportacion;


window.cerrarFormularioAportacion =
    cerrarFormularioAportacion;


window.registrarAportacion =
    registrarAportacion;


window.mostrarHistorial =
    mostrarHistorial;


window.cerrarHistorial =
    cerrarHistorial;


window.eliminarAportacion =
    eliminarAportacion;
