/* =========================================================
   HORIZONTE — script.js
   =========================================================
   IMPORTANTE:
   - Las rentabilidades son SIMULACIONES orientativas.
   - No representan rentabilidades garantizadas.
   - Cada usuario mantiene su propia cartera.
   - El Círculo solo comparte progreso agregado.
   ========================================================= */


/* =========================================================
   1. DATOS INICIALES
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
   2. CONFIGURACIÓN
   ========================================================= */

const RENTABILIDAD_SIMULADA = 0.05; // 5% anual
const AÑO_ACTUAL = new Date().getFullYear();


/* =========================================================
   3. FUNCIONES MATEMÁTICAS
   ========================================================= */

/**
 * Calcula el porcentaje de progreso de una meta.
 */
function calcularProgreso(ahorrado, objetivo) {
    if (!objetivo || objetivo <= 0) return 0;

    return Math.min(
        Math.round((ahorrado / objetivo) * 100),
        100
    );
}


/**
 * Calcula los años restantes.
 */
function calcularAñosRestantes(añoObjetivo) {
    return Math.max(añoObjetivo - AÑO_ACTUAL, 0);
}


/**
 * Calcula cuánto dinero se tendría aportando una cantidad
 * mensual determinada, con una rentabilidad anual simulada.
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
    const rentabilidadMensual = rentabilidadAnual / 12;

    let valor = capitalInicial;

    for (let i = 0; i < meses; i++) {
        valor = valor * (1 + rentabilidadMensual);
        valor += aportacionMensual;
    }

    return valor;
}


/**
 * Formatea números como euros.
 */
function formatearEuros(valor) {
    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0
    }).format(valor);
}


/**
 * Formatea números normales.
 */
function formatearNumero(valor) {
    return new Intl.NumberFormat("es-ES", {
        maximumFractionDigits: 0
    }).format(valor);
}


/* =========================================================
   4. CREAR UNA META
   ========================================================= */

function crearMeta() {

    const nombreInput = document.getElementById("nombreMeta");
    const objetivoInput = document.getElementById("objetivoMeta");
    const añoInput = document.getElementById("añoMeta");
    const mensualInput = document.getElementById("mensualMeta");

    if (!nombreInput || !objetivoInput || !añoInput || !mensualInput) {
        return;
    }

    const nombre = nombreInput.value.trim();
    const objetivo = Number(objetivoInput.value);
    const año = Number(añoInput.value);
    const mensual = Number(mensualInput.value);

    if (!nombre) {
        alert("Ponle un nombre a tu meta.");
        return;
    }

    if (!objetivo || objetivo <= 0) {
        alert("Introduce un objetivo válido.");
        return;
    }

    if (!año || año <= AÑO_ACTUAL) {
        alert(`El año objetivo debe ser posterior a ${AÑO_ACTUAL}.`);
        return;
    }

    if (mensual < 0) {
        alert("La aportación mensual no puede ser negativa.");
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

    metas.push(nuevaMeta);

    renderizarMetas();
    actualizarResumen();
    actualizarGraficaGeneral();

    nombreInput.value = "";
    objetivoInput.value = "";
    añoInput.value = "";
    mensualInput.value = "";

    const formulario = document.getElementById("formularioMeta");

    if (formulario) {
        formulario.style.display = "none";
    }
}


/* =========================================================
   5. ELIMINAR META
   ========================================================= */

function eliminarMeta(id) {

    const confirmar = confirm(
        "¿Seguro que quieres eliminar esta meta?"
    );

    if (!confirmar) return;

    metas = metas.filter(meta => meta.id !== id);

    renderizarMetas();
    actualizarResumen();
    actualizarGraficaGeneral();
}


/* =========================================================
   6. RENDERIZAR TODAS LAS METAS
   ========================================================= */

function renderizarMetas() {

    const contenedor = document.getElementById("listaMetas");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (metas.length === 0) {

        contenedor.innerHTML = `
            <div class="empty-state">
                <h3>Aún no tienes metas</h3>
                <p>Crea tu primera meta para empezar a construir tu horizonte.</p>
            </div>
        `;

        return;
    }

    metas.forEach(meta => {

        const tarjeta = crearTarjetaMeta(meta);

        contenedor.appendChild(tarjeta);

    });
}


/* =========================================================
   7. CREAR TARJETA DE META
   ========================================================= */

function crearTarjetaMeta(meta) {

    const tarjeta = document.createElement("article");

    tarjeta.className = "goal-card";

    const progreso = calcularProgreso(
        meta.ahorrado,
        meta.objetivo
    );

    const añosRestantes = calcularAñosRestantes(
        meta.año
    );

    const valorFuturo = calcularValorFuturo(
        meta.ahorrado,
        meta.mensual,
        añosRestantes
    );

    const diferencia = Math.max(
        meta.objetivo - meta.ahorrado,
        0
    );

    tarjeta.innerHTML = `

        <div class="goal-top">

            <div>
                <h3>${escapeHTML(meta.nombre)}</h3>

                <span class="goal-year">
                    Objetivo: ${meta.año}
                </span>
            </div>

            <div class="goal-percentage">
                ${progreso}%
            </div>

        </div>


        <div class="progress-bar">

            <div
                class="progress-fill"
                style="width: ${progreso}%"
            ></div>

        </div>


        <div class="goal-numbers">

            <div class="goal-info">

                <span>Ya tienes</span>

                <strong>
                    ${formatearEuros(meta.ahorrado)}
                </strong>

            </div>


            <div class="goal-info">

                <span>Objetivo</span>

                <strong>
                    ${formatearEuros(meta.objetivo)}
                </strong>

            </div>


            <div class="goal-info">

                <span>Faltan</span>

                <strong>
                    ${formatearEuros(diferencia)}
                </strong>

            </div>

        </div>


        <div class="goal-details">

            <div>
                <span>💶 Aportación mensual</span>
                <strong>${formatearEuros(meta.mensual)}</strong>
            </div>

            <div>
                <span>⏳ Tiempo restante</span>
                <strong>${añosRestantes} años</strong>
            </div>

        </div>


        <div class="future-value">

            <div>

                <span>
                    Simulación orientativa
                </span>

                <strong>
                    ${formatearEuros(valorFuturo)}
                </strong>

            </div>

            <small>
                Si mantuvieras ${formatearEuros(meta.mensual)}/mes
                con una rentabilidad hipotética del 5% anual.
                No garantiza rentabilidad.
            </small>

        </div>


        <div class="goal-actions">

            <button
                class="secondary-button"
                onclick="verDetalleMeta(${meta.id})"
            >
                Ver evolución
            </button>

            <button
                class="delete-button"
                onclick="eliminarMeta(${meta.id})"
            >
                Eliminar
            </button>

        </div>
    `;

    return tarjeta;
}


/* =========================================================
   8. DETALLE DE UNA META
   ========================================================= */

function verDetalleMeta(id) {

    const meta = metas.find(
        elemento => elemento.id === id
    );

    if (!meta) return;

    const años = calcularAñosRestantes(meta.año);

    const datos = generarDatosEvolucion(meta);

    mostrarModalMeta(meta, datos, años);
}


/* =========================================================
   9. GENERAR DATOS PARA LA GRÁFICA
   ========================================================= */

function generarDatosEvolucion(meta) {

    const añosRestantes = calcularAñosRestantes(meta.año);

    const datos = [];

    let capital = meta.ahorrado;

    for (let i = 0; i <= añosRestantes; i++) {

        const año = AÑO_ACTUAL + i;

        datos.push({
            año,
            valor: capital
        });

        capital = calcularValorFuturo(
            capital,
            meta.mensual,
            1
        );
    }

    return datos;
}


/* =========================================================
   10. MODAL DE DETALLE
   ========================================================= */

function mostrarModalMeta(meta, datos, años) {

    let modal = document.getElementById("modalMeta");

    if (!modal) {

        modal = document.createElement("div");

        modal.id = "modalMeta";

        modal.className = "modal";

        document.body.appendChild(modal);
    }

    const valorFinal =
        datos[datos.length - 1]?.valor || meta.ahorrado;

    modal.innerHTML = `

        <div class="modal-overlay" onclick="cerrarModalMeta()"></div>

        <div class="modal-content">

            <button
                class="modal-close"
                onclick="cerrarModalMeta()"
            >
                ×
            </button>

            <h2>${escapeHTML(meta.nombre)}</h2>

            <p>
                Evolución estimada hasta ${meta.año}
            </p>

            <div class="modal-stats">

                <div>
                    <span>Actualmente</span>
                    <strong>
                        ${formatearEuros(meta.ahorrado)}
                    </strong>
                </div>

                <div>
                    <span>Aportación mensual</span>
                    <strong>
                        ${formatearEuros(meta.mensual)}
                    </strong>
                </div>

                <div>
                    <span>Estimación final</span>
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
                hipotética del 5% anual. No garantiza
                rentabilidad futura.

            </p>

        </div>
    `;

    modal.classList.add("active");

    dibujarGraficaMeta(datos, meta);
}


/* =========================================================
   11. CERRAR MODAL
   ========================================================= */

function cerrarModalMeta() {

    const modal = document.getElementById("modalMeta");

    if (modal) {
        modal.classList.remove("active");
    }
}


/* =========================================================
   12. GRÁFICA DE UNA META
   ========================================================= */

function dibujarGraficaMeta(datos, meta) {

    const canvas = document.getElementById("graficaMeta");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    if (!datos.length) return;

    const margen = 55;

    const anchoGrafica =
        width - margen * 2;

    const altoGrafica =
        height - margen * 2;

    const valores = datos.map(
        dato => dato.valor
    );

    const maxValor = Math.max(
        meta.objetivo,
        ...valores
    );

    const minValor = 0;


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
        ((meta.objetivo - minValor) /
            (maxValor - minValor)) *
            altoGrafica;

    ctx.setLineDash([8, 6]);

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

    datos.forEach((dato, index) => {

        const x =
            margen +
            (index / (datos.length - 1 || 1)) *
            anchoGrafica;

        const y =
            height -
            margen -
            ((dato.valor - minValor) /
                (maxValor - minValor)) *
                altoGrafica;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();


    /* Puntos */

    datos.forEach((dato, index) => {

        const x =
            margen +
            (index / (datos.length - 1 || 1)) *
            anchoGrafica;

        const y =
            height -
            margen -
            ((dato.valor - minValor) /
                (maxValor - minValor)) *
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
    });


    /* Etiquetas */

    ctx.font = "13px Arial";

    ctx.textAlign = "center";

    datos.forEach((dato, index) => {

        const x =
            margen +
            (index / (datos.length - 1 || 1)) *
            anchoGrafica;

        ctx.fillText(
            dato.año,
            x,
            height - 20
        );
    });
}


/* =========================================================
   13. RESUMEN GENERAL
   ========================================================= */

function actualizarResumen() {

    const patrimonio = metas.reduce(
        (total, meta) =>
            total + meta.ahorrado,
        0
    );

    const aportacionMensual = metas.reduce(
        (total, meta) =>
            total + meta.mensual,
        0
    );

    const objetivos = metas.reduce(
        (total, meta) =>
            total + meta.objetivo,
        0
    );

    const progresoGeneral =
        objetivos > 0
            ? Math.round(
                (patrimonio / objetivos) * 100
            )
            : 0;


    actualizarElemento(
        "patrimonioTotal",
        formatearEuros(patrimonio)
    );

    actualizarElemento(
        "aportacionTotal",
        formatearEuros(aportacionMensual)
    );

    actualizarElemento(
        "progresoTotal",
        `${progresoGeneral}%`
    );

    actualizarElemento(
        "numeroMetas",
        metas.length
    );
}


/* =========================================================
   14. GRÁFICA GENERAL
   ========================================================= */

function actualizarGraficaGeneral() {

    const canvas =
        document.getElementById("graficaGeneral");

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    if (!metas.length) return;


    const años = 10;

    const datos = [];

    for (let año = 0; año <= años; año++) {

        let total = 0;

        metas.forEach(meta => {

            total += calcularValorFuturo(
                meta.ahorrado,
                meta.mensual,
                año
            );

        });

        datos.push(total);
    }


    const margen = 50;

    const ancho =
        width - margen * 2;

    const alto =
        height - margen * 2;

    const max =
        Math.max(...datos, 1);


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


    /* Línea */

    ctx.beginPath();

    datos.forEach((valor, index) => {

        const x =
            margen +
            (index / años) *
            ancho;

        const y =
            height -
            margen -
            (valor / max) *
            alto;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();


    /* Puntos */

    datos.forEach((valor, index) => {

        const x =
            margen +
            (index / años) *
            ancho;

        const y =
            height -
            margen -
            (valor / max) *
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
    });
}


/* =========================================================
   15. COMPARADOR DE APORTACIONES
   ========================================================= */

function calcularEscenarios(meta) {

    const años =
        calcularAñosRestantes(meta.año);

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

    return escenarios.map(escenario => {

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
    });
}


/* =========================================================
   16. MOSTRAR COMPARADOR
   ========================================================= */

function mostrarComparador(id) {

    const meta = metas.find(
        elemento => elemento.id === id
    );

    if (!meta) return;

    const escenarios =
        calcularEscenarios(meta);

    let contenedor =
        document.getElementById("comparador");

    if (!contenedor) {

        contenedor =
            document.createElement("div");

        contenedor.id = "comparador";

        contenedor.className =
            "comparison-container";

        const metasSection =
            document.getElementById("metas");

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

        <h3>
            ¿Qué pasa si aumentas tu aportación?
        </h3>

        <p>
            ${escapeHTML(meta.nombre)}
        </p>

        <div class="comparison-grid">

            ${escenarios.map(escenario => `

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

            `).join("")}

        </div>

        <small class="simulation-warning">
            Simulación orientativa al 5% anual.
            No garantiza rentabilidad.
        </small>
    `;
}


/* =========================================================
   17. "TU YO DEL FUTURO"
   ========================================================= */

function actualizarYoDelFuturo() {

    const elemento =
        document.getElementById("yoDelFuturo");

    if (!elemento) return;

    if (!metas.length) {

        elemento.innerHTML = `
            <p>
                Crea una meta para empezar a visualizar
                tu futuro financiero.
            </p>
        `;

        return;
    }

    const totalActual =
        metas.reduce(
            (total, meta) =>
                total + meta.ahorrado,
            0
        );

    const totalMensual =
        metas.reduce(
            (total, meta) =>
                total + meta.mensual,
            0
        );

    const valorFuturo =
        calcularValorFuturo(
            totalActual,
            totalMensual,
            10
        );


    elemento.innerHTML = `

        <div class="future-message">

            <span>
                En 10 años
            </span>

            <strong>
                ${formatearEuros(valorFuturo)}
            </strong>

            <p>
                Si mantuvieras tus aportaciones actuales
                y se produjera una rentabilidad hipotética
                del 5% anual.
            </p>

            <small>
                Simulación orientativa · No garantiza
                rentabilidad.
            </small>

        </div>
    `;
}


/* =========================================================
   18. CÍRCULO
   =========================================================
   
   IMPORTANTE:
   
   Aquí NO se permite modificar la cartera de otra persona.
   
   Solo mostramos:
   - nombre
   - meta compartida
   - progreso agregado
   
   Los datos individuales de inversión permanecen separados.
   ========================================================= */

const circulo = [
    {
        nombre: "Paula",
        meta: "Viaje a Japón",
        objetivo: 18000,
        progreso: 58
    },
    {
        nombre: "Ana",
        meta: "Viaje a Japón",
        objetivo: 18000,
        progreso: 42
    },
    {
        nombre: "Lucía",
        meta: "Viaje a Japón",
        objetivo: 18000,
        progreso: 73
    }
];


function actualizarCirculo() {

    const contenedor =
        document.getElementById("circulo");

    if (!contenedor) return;

    contenedor.innerHTML = `

        <div class="circle-header">

            <h3>
                Mi Círculo
            </h3>

            <p>
                Compartid objetivos y progreso,
                sin modificar las carteras de los demás.
            </p>

        </div>

        <div class="circle-members">

            ${circulo.map(persona => `

                <div class="circle-member">

                    <div class="circle-avatar">
                        ${persona.nombre
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div class="circle-info">

                        <strong>
                            ${escapeHTML(persona.nombre)}
                        </strong>

                        <span>
                            ${escapeHTML(persona.meta)}
                        </span>

                    </div>

                    <div class="circle-progress">

                        <strong>
                            ${persona.progreso}%
                        </strong>

                        <div class="progress-bar">

                            <div
                                class="progress-fill"
                                style="
                                    width:
                                    ${persona.progreso}%
                                "
                            ></div>

                        </div>

                    </div>

                </div>

            `).join("")}

        </div>
    `;
}


/* =========================================================
   19. BOTÓN "NUEVA META"
   ========================================================= */

function configurarBotonNuevaMeta() {

    const boton =
        document.getElementById("nuevaMeta");

    const formulario =
        document.getElementById("formularioMeta");

    if (!boton || !formulario) return;

    boton.addEventListener(
        "click",
        () => {

            if (
                formulario.style.display === "none" ||
                !formulario.style.display
            ) {
                formulario.style.display = "block";
            } else {
                formulario.style.display = "none";
            }

        }
    );
}


/* =========================================================
   20. BOTÓN "CREAR META"
   ========================================================= */

function configurarFormulario() {

    const boton =
        document.getElementById("crearMeta");

    if (!boton) return;

    boton.addEventListener(
        "click",
        crearMeta
    );
}


/* =========================================================
   21. ACTUALIZAR ELEMENTO
   ========================================================= */

function actualizarElemento(
    id,
    contenido
) {

    const elemento =
        document.getElementById(id);

    if (!elemento) return;

    elemento.textContent = contenido;
}


/* =========================================================
   22. SEGURIDAD BÁSICA PARA TEXTO INTRODUCIDO
   ========================================================= */

function escapeHTML(texto) {

    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   23. INICIALIZACIÓN
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
   24. FUNCIONES DISPONIBLES DESDE HTML
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
