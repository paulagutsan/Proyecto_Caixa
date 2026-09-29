/* =========================================================
   HORIZONTE · script.js
   =========================================================

   Esta versión diferencia claramente:

   1. DINERO REAL REGISTRADO
      -> Lo que el usuario ha introducido.

   2. APORTACIÓN PREVISTA
      -> Lo que el usuario planea aportar cada mes.

   3. SIMULACIÓN
      -> Una hipótesis de crecimiento futuro utilizando
         un 5% anual.

   La inflación NO forma parte de esta simulación.

   ========================================================= */


/* =========================================================
   1. CONFIGURACIÓN
   ========================================================= */

const RENTABILIDAD_SIMULADA = 0.05;

const AÑO_ACTUAL =
    new Date().getFullYear();

const STORAGE_KEY =
    "horizonte_metas_v3";


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

        const guardadas =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!guardadas) {

            return copiarMetasIniciales();

        }


        const datos =
            JSON.parse(
                guardadas
            );


        if (
            !Array.isArray(datos)
        ) {

            return copiarMetasIniciales();

        }


        return datos;

    } catch (error) {

        console.error(
            "Error cargando las metas:",
            error
        );

        return copiarMetasIniciales();

    }

}


/* =========================================================
   4. COPIAR DATOS INICIALES
   ========================================================= */

function copiarMetasIniciales() {

    return JSON.parse(
        JSON.stringify(
            metasIniciales
        )
    );

}


/* =========================================================
   5. VARIABLE PRINCIPAL
   ========================================================= */

let metas =
    cargarMetas();


/* =========================================================
   6. GUARDAR DATOS
   ========================================================= */

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
            "Error guardando las metas:",
            error
        );

    }

}


/* =========================================================
   7. CÍRCULO
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
   8. PROGRESO
   ========================================================= */

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


/* =========================================================
   9. AÑOS RESTANTES
   ========================================================= */

function calcularAñosRestantes(
    añoObjetivo
) {

    return Math.max(
        añoObjetivo -
        AÑO_ACTUAL,
        0
    );

}


/* =========================================================
   10. VALOR FUTURO
   ========================================================= */

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


    const interesMensual =
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
                interesMensual
            );


        valor +=
            Number(
                aportacionMensual
            ) || 0;

    }


    return valor;

}


/* =========================================================
   11. APORTACIONES FUTURAS
   ========================================================= */

function calcularAportacionesFuturas(
    mensual,
    años
) {

    return (
        Number(mensual) *
        Math.round(
            años * 12
        )
    );

}


/* =========================================================
   12. CRECIMIENTO SIMULADO
   ========================================================= */

function calcularCrecimientoSimulado(
    meta
) {

    const años =
        calcularAñosRestantes(
            meta.año
        );


    const aportacionesFuturas =
        calcularAportacionesFuturas(
            meta.mensual,
            años
        );


    const valorFuturo =
        calcularValorFuturo(
            meta.ahorrado,
            meta.mensual,
            años
        );


    const crecimiento =
        Math.max(
            valorFuturo -
            meta.ahorrado -
            aportacionesFuturas,
            0
        );


    return {

        años,

        aportacionesFuturas,

        crecimiento,

        valorFuturo

    };

}


/* =========================================================
   13. EUROS
   ========================================================= */

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


/* =========================================================
   14. FECHA
   ========================================================= */

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
   15. FECHA ACTUAL
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


    return (
        `${año}-${mes}-${dia}`
    );

}


/* =========================================================
   16. ESCAPAR HTML
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
   17. ICONO
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
   18. DESCRIPCIÓN
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
   19. CREAR META
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
        objetivo <= 0 ||
        !Number.isFinite(
            objetivo
        )
    ) {

        alert(
            "Introduce un objetivo válido."
        );

        return;

    }


    if (
        año <= AÑO_ACTUAL ||
        !Number.isFinite(
            año
        )
    ) {

        alert(
            `El año objetivo debe ser posterior a ${AÑO_ACTUAL}.`
        );

        return;

    }


    if (
        mensual < 0 ||
        !Number.isFinite(
            mensual
        )
    ) {

        alert(
            "Introduce una aportación mensual válida."
        );

        return;

    }


    const nuevaMeta = {

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

    };


    metas.push(
        nuevaMeta
    );


    guardarMetas();


    renderizarMetas();

    actualizarResumen();

    actualizarGraficaGeneral();

    actualizarYoDelFuturo();


    nombreInput.value =
        "";

    objetivoInput.value =
        "";

    añoInput.value =
        "";

    mensualInput.value =
        "";


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
   20. RENDERIZAR METAS
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
   21. CREAR TARJETA
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


    const simulacion =
        calcularCrecimientoSimulado(
            meta
        );


    const aportaciones =
        Array.isArray(
            meta.aportaciones
        )
            ? meta.aportaciones
            : [];


    tarjeta.innerHTML = `

        <div class="goal-icon">

            ${obtenerIconoMeta(
                meta.nombre
            )}

        </div>


        <div class="goal-content">


            <div class="goal-title">

                <h3>
                    ${escapeHTML(
                        meta.nombre
                    )}
                </h3>

                <span>
                    ${meta.año}
                </span>

            </div>


            <p>

                ${generarDescripcionMeta(
                    meta
                )}

            </p>


            <!-- =========================================
                 DINERO REAL
            ========================================== -->

            <div class="progress-info">

                <span>
                    Has conseguido
                    ${formatearEuros(
                        meta.ahorrado
                    )}
                    de
                    ${formatearEuros(
                        meta.objetivo
                    )}
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

                    Aportación prevista ·
                    ${formatearEuros(
                        meta.mensual
                    )}/mes

                </span>


                <span>

                    ${añosRestantes}

                    ${
                        añosRestantes === 1
                            ? "año"
                            : "años"
                    }

                    restantes

                </span>

            </div>


            <!-- =========================================
                 BOTÓN APORTACIÓN
            ========================================== -->

            <button
                class="primary-button contribution-button"
                type="button"
                onclick="abrirFormularioAportacion(${meta.id})"
            >

                + Registrar aportación

            </button>


            <!-- =========================================
                 HISTORIAL
            ========================================== -->

            <div class="contribution-summary">

                <span>

                    ${
                        aportaciones.length
                    }

                    ${
                        aportaciones.length === 1
                            ? "aportación registrada"
                            : "aportaciones registradas"
                    }

                </span>


                <button
                    class="history-button"
                    type="button"
                    onclick="mostrarHistorial(${meta.id})"
                >

                    Ver historial →

                </button>

            </div>


            <!-- =========================================
                 FORMULARIO APORTACIÓN
            ========================================== -->

            <div
                id="aportacion-form-${meta.id}"
                class="contribution-form"
                style="display:none;"
            >


                <div class="form-field">

                    <label
                        for="cantidad-${meta.id}"
                    >
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

                    <label
                        for="fecha-${meta.id}"
                    >
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



            <!-- =========================================
                 SIMULACIÓN
            ========================================== -->

            <div class="future-value">


                <div class="simulation-title">

                    <span>
                        ¿Qué podría pasar?
                    </span>

                </div>


                <p>

                    Si mantienes una aportación de

                    <strong>
                        ${formatearEuros(
                            meta.mensual
                        )}/mes
                    </strong>

                    durante

                    <strong>
                        ${simulacion.años}
                        ${
                            simulacion.años === 1
                                ? "año"
                                : "años"
                        }
                    </strong>:

                </p>


                <div class="simulation-breakdown">


                    <div>

                        <span>
                            Capital actual
                        </span>

                        <strong>
                            ${formatearEuros(
                                meta.ahorrado
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Aportaciones futuras
                        </span>

                        <strong>
                            ${formatearEuros(
                                simulacion.aportacionesFuturas
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Crecimiento simulado
                        </span>

                        <strong>
                            +${formatearEuros(
                                simulacion.crecimiento
                            )}
                        </strong>

                    </div>


                </div>


                <div class="simulation-result">


                    <span>
                        Valor estimado
                    </span>


                    <strong>
                        ${formatearEuros(
                            simulacion.valorFuturo
                        )}
                    </strong>


                </div>


                <small>

                    Hipótesis utilizada:
                    5% de rentabilidad anual.

                    La inflación no está incluida.

                    No es una previsión ni una garantía.

                </small>


            </div>



            <!-- =========================================
                 ACCIONES
            ========================================== -->

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

                    Comparar aportaciones

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
   22. ABRIR FORMULARIO DE APORTACIÓN
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


    const estaOculto =
        formulario.style.display ===
        "none";


    formulario.style.display =
        estaOculto
            ? "block"
            : "none";


    if (estaOculto) {

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
   23. CERRAR FORMULARIO
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
   24. REGISTRAR APORTACIÓN
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

        meta.aportaciones =
            [];

    }


    meta.aportaciones.push({

        id:
            Date.now(),

        cantidad,

        fecha

    });


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


    mostrarMensajeAportacion(
        cantidad
    );

}


/* =========================================================
   25. MENSAJE DE ÉXITO
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
        `Has registrado ${formatearEuros(cantidad)} correctamente.`;


    document.body.appendChild(
        mensaje
    );


    requestAnimationFrame(
        () => {

            mensaje.classList.add(
                "show"
            );

        }
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
   26. HISTORIAL
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
            ? [
                ...meta.aportaciones
            ]
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
                ${escapeHTML(
                    meta.nombre
                )}
            </h2>


            <p>
                Estas son las aportaciones
                que has registrado.
            </p>


            <div class="history-total">

                <span>
                    Total registrado
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

                    ?

                    `

                        <div class="empty-history">

                            <p>

                                Todavía no has registrado
                                ninguna aportación.

                            </p>

                        </div>

                    `

                    :

                    aportaciones
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
   27. CERRAR HISTORIAL
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
   28. ELIMINAR APORTACIÓN
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
   29. ELIMINAR META
   ========================================================= */

function eliminarMeta(
    id
) {

    const confirmar =
        confirm(
            "¿Seguro que quieres eliminar esta meta y todas sus aportaciones?"
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
   30. DETALLE DE META
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
   31. DATOS GRÁFICA META
   ========================================================= */

function generarDatosEvolucion(
    meta
) {

    const años =
        calcularAñosRestantes(
            meta.año
        );


    const datos = [];


    for (
        let i = 0;
        i <= años;
        i++
    ) {

        datos.push({

            año:
                AÑO_ACTUAL + i,

            valor:
                calcularValorFuturo(
                    meta.ahorrado,
                    meta.mensual,
                    i
                )

        });

    }


    return datos;

}


/* =========================================================
   32. MODAL EVOLUCIÓN
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


    const simulacion =
        calcularCrecimientoSimulado(
            meta
        );


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
                EVOLUCIÓN DE TU META
            </p>


            <h2>
                ${escapeHTML(
                    meta.nombre
                )}
            </h2>


            <p>

                Aquí puedes ver cómo podría evolucionar
                manteniendo tu aportación prevista.

            </p>


            <div class="modal-stats">


                <div>

                    <span>
                        Registrado
                    </span>

                    <strong>
                        ${formatearEuros(
                            meta.ahorrado
                        )}
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
                        Valor simulado
                    </span>

                    <strong>
                        ${formatearEuros(
                            simulacion.valorFuturo
                        )}
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


            <div class="simulation-breakdown">


                <div>

                    <span>
                        Capital actual
                    </span>

                    <strong>
                        ${formatearEuros(
                            meta.ahorrado
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Aportaciones futuras
                    </span>

                    <strong>
                        ${formatearEuros(
                            simulacion.aportacionesFuturas
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Crecimiento simulado
                    </span>

                    <strong>
                        +${formatearEuros(
                            simulacion.crecimiento
                        )}
                    </strong>

                </div>


            </div>


            <p class="simulation-warning">

                Hipótesis: 5% de rentabilidad anual.
                La inflación no está incluida.
                Esta cifra no es una previsión ni una garantía.

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
   33. CERRAR MODAL META
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
   34. DIBUJAR GRÁFICA DE META
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


    const margen =
        55;


    const ancho =
        width -
        margen * 2;


    const alto =
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
        alto;


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
                ancho;


            const y =
                height -
                margen -
                (
                    dato.valor /
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
                ancho;


            const y =
                height -
                margen -
                (
                    dato.valor /
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
                ancho;


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
   35. RESUMEN GENERAL
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


    const progreso =
        objetivos > 0
            ? Math.round(
                (
                    patrimonio /
                    objetivos
                ) *
                100
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


/* =========================================================
   36. ACTUALIZAR ELEMENTO
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
   37. GRÁFICA GENERAL
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
        let i = 0;
        i <= años;
        i++
    ) {

        let total = 0;


        metas.forEach(
            meta => {

                total +=
                    calcularValorFuturo(
                        meta.ahorrado,
                        meta.mensual,
                        i
                    );

            }
        );


        datos.push(
            total
        );

    }


    const margen =
        55;


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
                AÑO_ACTUAL + index,
                x,
                height -
                20
            );

        }
    );

}


/* =========================================================
   38. COMPARADOR
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
            nombre: "Aportación actual",
            mensual: meta.mensual
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

            return {

                ...escenario,

                valor:
                    calcularValorFuturo(
                        meta.ahorrado,
                        escenario.mensual,
                        años
                    )

            };

        }
    );

}


/* =========================================================
   39. MOSTRAR COMPARADOR
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


        const section =
            document.getElementById(
                "metas"
            );


        if (section) {

            section.appendChild(
                contenedor
            );

        }

    }


    contenedor.innerHTML = `

        <div class="comparison-header">

            <p class="eyebrow">
                COMPARADOR
            </p>

            <h3>
                ¿Qué cambia si aportas más?
            </h3>

            <p>
                ${escapeHTML(
                    meta.nombre
                )}
            </p>

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
            No representa una previsión ni una garantía.

        </small>

    `;


    contenedor.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =========================================================
   40. TU YO DEL FUTURO
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
                    meta.ahorrado
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
                    meta.mensual
                ),
            0
        );


    const futuro =
        calcularValorFuturo(
            actual,
            mensual,
            10
        );


    const crecimiento =
        Math.max(
            futuro -
            actual -
            (
                mensual *
                120
            ),
            0
        );


    elemento.innerHTML = `

        <p class="future-message">

            “Lo que haces hoy puede cambiar
            las opciones que tienes mañana.”

        </p>


        <div class="future-result">

            <span>
                En 10 años
            </span>


            <strong>
                ${formatearEuros(
                    futuro
                )}
            </strong>


            <small>

                Con tus aportaciones previstas,
                el resultado simulado sería de

                ${formatearEuros(
                    futuro
                )}

                , de los cuales el crecimiento
                hipotético sería aproximadamente

                ${formatearEuros(
                    crecimiento
                )}

                .

            </small>

        </div>

    `;

}


/* =========================================================
   41. MI CÍRCULO
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
                ${formatearEuros(
                    total
                )}
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
   42. BOTÓN NUEVA META
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
   43. FORMULARIO NUEVA META
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
   44. ESC
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
   45. INICIALIZACIÓN
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
   46. FUNCIONES GLOBALES
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
