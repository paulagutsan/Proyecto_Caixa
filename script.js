/* =========================================================
   HORIZONTE · script.js
   =========================================================

   Funcionalidades:

   - Gestión de metas personales
   - Cálculo de progreso
   - Cálculo de aportaciones
   - Simulación de evolución
   - Gráficas
   - Comparación de aportaciones
   - "Tu yo del futuro"
   - Mi Círculo
   - Privacidad entre carteras

   NOTA:
   Las rentabilidades utilizadas son hipotéticas.
   No representan rentabilidades garantizadas.
   ========================================================= */


/* =========================================================
   1. CONFIGURACIÓN
   ========================================================= */

const RENTABILIDAD_SIMULADA = 0.05;
const AÑO_ACTUAL = new Date().getFullYear();


/* =========================================================
   2. DATOS INICIALES
   ========================================================= */

let metas = [

    {
        id: 1,
        nombre: "Mi primera casa",
        objetivo: 25000,
        ahorrado: 8450,
        año: 2032,
        mensual: 170
    },

    {
        id: 2,
        nombre: "Año sabático",
        objetivo: 12000,
        ahorrado: 3920,
        año: 2030,
        mensual: 120
    },

    {
        id: 3,
        nombre: "Independencia",
        objetivo: 30000,
        ahorrado: 6280,
        año: 2040,
        mensual: 100
    }

];


/* =========================================================
   3. DATOS DEL CÍRCULO
   =========================================================

   Estos datos son únicamente de demostración.

   Cada persona tiene su propia posición.

   Compartimos:
   - nombre
   - meta
   - progreso

   No compartimos ni modificamos la cartera de otra persona.
   ========================================================= */

const circulo = [

    {
        nombre: "Andrea",
        meta: "Viaje a Japón 🇯🇵",
        progreso: 54,
        aportado: 3240
    },

    {
        nombre: "Lucía",
        meta: "Viaje a Japón 🇯🇵",
        progreso: 47,
        aportado: 2800
    },

    {
        nombre: "Carlos",
        meta: "Viaje a Japón 🇯🇵",
        progreso: 39,
        aportado: 2100
    },

    {
        nombre: "Tú",
        meta: "Viaje a Japón 🇯🇵",
        progreso: 30,
        aportado: 1650
    },

    {
        nombre: "María",
        meta: "Viaje a Japón 🇯🇵",
        progreso: 14,
        aportado: 650
    }

];

const CIRCULO_OBJETIVO = 18000;


/* =========================================================
   4. FUNCIONES MATEMÁTICAS
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
            (ahorrado / objetivo) * 100
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
        añoObjetivo - AÑO_ACTUAL,
        0
    );
}


/**
 * Calcula el valor futuro de una cantidad
 * con aportaciones mensuales.
 */
function calcularValorFuturo(
    capitalInicial,
    aportacionMensual,
    años,
    rentabilidadAnual = RENTABILIDAD_SIMULADA
) {

    if (años <= 0) {
        return capitalInicial;
    }

    const meses = años * 12;

    const rentabilidadMensual =
        rentabilidadAnual / 12;

    let valor = capitalInicial;


    for (
        let i = 0;
        i < meses;
        i++
    ) {

        valor =
            valor *
            (1 + rentabilidadMensual);

        valor += aportacionMensual;
    }


    return valor;
}


/**
 * Formatea un número como euros.
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
    ).format(valor);
}


/**
 * Formatea números.
 */
function formatearNumero(
    valor
) {

    return new Intl.NumberFormat(
        "es-ES",
        {
            maximumFractionDigits: 0
        }
    ).format(valor);
}


/* =========================================================
   5. SEGURIDAD HTML
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
   6. CREAR NUEVA META
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


    if (mensual < 0) {

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

        mensual

    };


    metas.push(
        nuevaMeta
    );


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
   7. ELIMINAR META
   ========================================================= */

function eliminarMeta(
    id
) {

    const confirmar =
        confirm(
            "¿Seguro que quieres eliminar esta meta?"
        );


    if (!confirmar) {
        return;
    }


    metas =
        metas.filter(
            meta =>
                meta.id !== id
        );


    renderizarMetas();

    actualizarResumen();

    actualizarGraficaGeneral();

    actualizarYoDelFuturo();

}


/* =========================================================
   8. RENDERIZAR METAS
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


    if (metas.length === 0) {

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

            const tarjeta =
                crearTarjetaMeta(
                    meta
                );

            contenedor.appendChild(
                tarjeta
            );

        }
    );

}


/* =========================================================
   9. CREAR TARJETA DE META
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


    const diferencia =
        Math.max(
            meta.objetivo -
            meta.ahorrado,
            0
        );


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


            <div class="future-value">

                <span>
                    Simulación orientativa
                </span>

                <strong>
                    ${formatearEuros(valorFuturo)}
                </strong>

                <small>
                    Estimación con una rentabilidad
                    hipotética del 5% anual.
                    No garantiza rentabilidad.
                </small>

            </div>


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
   10. DESCRIPCIÓN AUTOMÁTICA
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
   11. ICONOS
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
   12. DETALLE DE META
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
   13. DATOS DE EVOLUCIÓN
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

        const año =
            AÑO_ACTUAL + i;


        datos.push({

            año,

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
   14. MODAL
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
        datos.length > 0
            ? datos[datos.length - 1].valor
            : meta.ahorrado;


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
                Evolución estimada hasta ${meta.año}
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
                        Aportación mensual
                    </span>

                    <strong>
                        ${formatearEuros(meta.mensual)}
                    </strong>

                </div>


                <div>

                    <span>
                        Estimación final
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
   15. CERRAR MODAL
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
   16. GRÁFICA DE META
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


    const valores =
        datos.map(
            dato =>
                dato.valor
        );


    const maxValor =
        Math.max(
            meta.objetivo,
            ...valores,
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
        height - margen
    );

    ctx.lineTo(
        width - margen,
        height - margen
    );

    ctx.stroke();


    /* Línea objetivo */

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
        width - margen,
        yObjetivo
    );

    ctx.stroke();


    ctx.setLineDash([]);


    /* Línea de evolución */

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
                        datos.length - 1 ||
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


            if (index === 0) {

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
                        datos.length - 1 ||
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
                        datos.length - 1 ||
                        1
                    )
                ) *
                anchoGrafica;


            ctx.fillText(
                dato.año,
                x,
                height - 20
            );

        }
    );

}


/* =========================================================
   17. RESUMEN GENERAL
   ========================================================= */

function actualizarResumen() {

    const patrimonio =
        metas.reduce(
            (
                total,
                meta
            ) =>
                total +
                meta.ahorrado,
            0
        );


    const aportacionMensual =
        metas.reduce(
            (
                total,
                meta
            ) =>
                total +
                meta.mensual,
            0
        );


    const objetivos =
        metas.reduce(
            (
                total,
                meta
            ) =>
                total +
                meta.objetivo,
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
   18. ACTUALIZAR ELEMENTO
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
   19. GRÁFICA GENERAL
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


    const datos =
        [];


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
        height - margen
    );

    ctx.lineTo(
        width - margen,
        height - margen
    );

    ctx.stroke();


    /* Línea principal */

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


            if (index === 0) {

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
                height - 20
            );

        }
    );

}


/* =========================================================
   20. COMPARAR APORTACIONES
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
            mensual: meta.mensual
        },

        {
            nombre: "+50 €/mes",
            mensual: meta.mensual + 50
        },

        {
            nombre: "+100 €/mes",
            mensual: meta.mensual + 100
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
   21. MOSTRAR COMPARADOR
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
   22. TU YO DEL FUTURO
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

                Crea una meta para empezar a visualizar
                tu futuro financiero.

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
                meta.ahorrado,
            0
        );


    const totalMensual =
        metas.reduce(
            (
                total,
                meta
            ) =>
                total +
                meta.mensual,
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
                tus aportaciones actuales y una
                rentabilidad del 5% anual.

            </small>

        </div>

    `;

}


/* =========================================================
   23. MI CÍRCULO
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
                persona.aportado,
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
                        circulo.length - 4,
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
   24. BOTÓN NUEVA META
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

            const estaOculto =
                formulario.style.display ===
                "none";


            formulario.style.display =
                estaOculto
                    ? "block"
                    : "none";


            if (estaOculto) {

                formulario.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

        }
    );

}


/* =========================================================
   25. FORMULARIO
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
   26. CERRAR MODAL CON ESC
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            cerrarModalMeta();

        }

    }
);


/* =========================================================
   27. INICIALIZACIÓN
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
   28. FUNCIONES DISPONIBLES PARA HTML
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
