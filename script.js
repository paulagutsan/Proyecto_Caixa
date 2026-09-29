// ===============================
// HORIZONTE - INTERACTIVIDAD
// ===============================

// Datos iniciales de las metas
let metas = [
    {
        nombre: "Mi primera casa",
        año: 2032,
        objetivo: 25000,
        ahorrado: 8450,
        mensual: 170
    },
    {
        nombre: "Año sabático",
        año: 2030,
        objetivo: 12000,
        ahorrado: 3920,
        mensual: 120
    },
    {
        nombre: "Independencia",
        año: 2040,
        objetivo: 30000,
        ahorrado: 6280,
        mensual: 100
    }
];


// ===============================
// CALCULAR PROGRESO
// ===============================

function calcularProgreso(ahorrado, objetivo) {

    let progreso = (ahorrado / objetivo) * 100;

    // Evitamos que pase del 100%
    if (progreso > 100) {
        progreso = 100;
    }

    return progreso;
}


// ===============================
// CALCULAR AÑOS RESTANTES
// ===============================

function añosRestantes(añoObjetivo) {

    const añoActual = new Date().getFullYear();

    return Math.max(0, añoObjetivo - añoActual);
}


// ===============================
// CALCULAR DINERO FUTURO
// ===============================

// Simulación sencilla con una rentabilidad anual hipotética del 5%.
// IMPORTANTE: es una simulación ilustrativa, no una promesa de rentabilidad.

function calcularValorFuturo(mensual, años, rentabilidad = 0.05) {

    const meses = años * 12;
    const tasaMensual = rentabilidad / 12;

    if (meses <= 0) {
        return 0;
    }

    const valorFuturo =
        mensual *
        ((Math.pow(1 + tasaMensual, meses) - 1) / tasaMensual);

    return valorFuturo;
}


// ===============================
// FORMATEAR EUROS
// ===============================

function euros(valor) {

    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0
    }).format(valor);
}


// ===============================
// CREAR UNA NUEVA META
// ===============================

function crearMeta() {

    const nombre = document.getElementById("nombreMeta").value;
    const objetivo = Number(document.getElementById("objetivoMeta").value);
    const año = Number(document.getElementById("añoMeta").value);
    const mensual = Number(document.getElementById("mensualMeta").value);

    if (!nombre || !objetivo || !año || !mensual) {

        alert("Completa todos los campos para crear tu meta.");

        return;
    }

    const nuevaMeta = {

        nombre: nombre,
        año: año,
        objetivo: objetivo,
        ahorrado: 0,
        mensual: mensual

    };

    metas.push(nuevaMeta);

    mostrarMetas();

    // Limpiar formulario
    document.getElementById("nombreMeta").value = "";
    document.getElementById("objetivoMeta").value = "";
    document.getElementById("añoMeta").value = "";
    document.getElementById("mensualMeta").value = "";

    alert("Tu nueva meta se ha creado.");
}


// ===============================
// MOSTRAR METAS
// ===============================

function mostrarMetas() {

    const contenedor = document.getElementById("listaMetas");

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";

    metas.forEach((meta, index) => {

        const progreso = calcularProgreso(
            meta.ahorrado,
            meta.objetivo
        );

        const años = añosRestantes(meta.año);

        const valorFuturo = calcularValorFuturo(
            meta.mensual,
            años
        );

        const tarjeta = document.createElement("div");

        tarjeta.className = "goal-card";

        tarjeta.innerHTML = `

            <div class="goal-top">

                <div>

                    <h3>${meta.nombre}</h3>

                    <p>Objetivo ${meta.año}</p>

                </div>

                <span class="goal-percentage">
                    ${Math.round(progreso)}%
                </span>

            </div>


            <div class="progress-bar">

                <div
                    class="progress-fill"
                    style="width: ${progreso}%">
                </div>

            </div>


            <div class="goal-numbers">

                <span>
                    ${euros(meta.ahorrado)}
                </span>

                <span>
                    ${euros(meta.objetivo)}
                </span>

            </div>


            <div class="goal-info">

                <span>
                    ${euros(meta.mensual)}/mes
                </span>

                <span>
                    ${años} años restantes
                </span>

            </div>


            <div class="future-value">

                <strong>
                    ${euros(valorFuturo)}
                </strong>

                <small>
                    Simulación ilustrativa con 5% anual
                </small>

            </div>

        `;

        contenedor.appendChild(tarjeta);

    });

}


// ===============================
// FORMULARIO DE NUEVA META
// ===============================

function mostrarFormulario() {

    const formulario =
        document.getElementById("formularioMeta");

    if (!formulario) {
        return;
    }

    formulario.classList.toggle("visible");

}


// ===============================
// BOTONES
// ===============================

document.addEventListener("DOMContentLoaded", function () {

    mostrarMetas();

    const botonNuevaMeta =
        document.getElementById("nuevaMeta");

    if (botonNuevaMeta) {

        botonNuevaMeta.addEventListener(
            "click",
            mostrarFormulario
        );

    }


    const botonCrear =
        document.getElementById("crearMeta");

    if (botonCrear) {

        botonCrear.addEventListener(
            "click",
            crearMeta
        );

    }

});
