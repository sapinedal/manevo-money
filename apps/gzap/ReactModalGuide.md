# Guía de Replicación de Pretty Modal en React (GSAP + Flip)

Este documento detalla el funcionamiento técnico del modal animado (`PrettyModal`) y establece las directrices para implementar el mismo comportamiento en un componente o hook de React usando **GSAP** y su plugin **Flip**.

---

## 1. Concepto y Flujo de Animación

El objetivo es lograr un efecto de **morfismo** donde el modal:
1. **Entrada (Open):** Nace visualmente desde la posición y tamaño exactos del botón que lo activó (disparador), expandiéndose elásticamente hasta su posición final como un modal nativo (`<dialog>`).
2. **Salida (Close):** Se encoge de vuelta hacia el botón disparador, mientras se desvanece, se difumina y redondea sus esquinas.

---

## 2. Dependencias Requeridas

Para lograr exactamente el mismo flujo, el proyecto React debe tener instalados y registrados los siguientes plugins de GSAP:
- **GSAP Core** (`gsap`)
- **GSAP Flip** (para interpolar el cambio de layout del disparador al modal)
- **CustomEase** (para la curva de animación elástica personalizada)

### Registro en JS/TS:
```javascript
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(Flip, CustomEase);
```

---

## 3. Mecánica Detallada del Flujo

### A. Apertura (Open)
1. **Identificar Elementos:** Se necesita el elemento del botón disparador (`origin`) y el elemento del modal (`dialog`).
2. **Emparejar con Flip ID:** Se les asigna un identificador único temporal (`data-flip-id` o propiedad equivalente de Flip) a ambos elementos para indicar que representan el "mismo" objeto en la transición.
3. **Capturar Estado Inicial:** Se captura la posición y dimensiones del disparador utilizando `Flip.getState(origin)`.
4. **Mostrar Modal:** Se abre el modal de manera nativa ejecutando `dialog.showModal()`. Esto cambia instantáneamente el layout del modal a su posición central de destino.
5. **Animar con `Flip.from`:** Se ejecuta la animación de transición desde la posición capturada de `origin` hacia la posición actual del `dialog`:
   - **Target:** El elemento `dialog`.
   - **Scale:** `true` (para animar tamaño y escala).
   - **Duración:** `0.7` segundos.
   - **Curva custom (Ease):**
     `CustomEase.create("custom", "M0,0 C0.305,0.206 0.116,0.567 0.3,0.8 0.394,0.921 0.491,1 1,1")` (un rebote/elasticidad sutil al final).
   - **Clase temporal de CSS:** Durante la animación, se añade la clase `.pretty-modal-opening` al modal para aplicar efectos de difuminado y opacidad mediante keyframes CSS.

### B. Cierre (Close)
1. **Identificar Elementos:** Se localiza el modal (`dialog`) y el botón disparador original (`origin`) que lo abrió (se puede identificar buscando el elemento con el mismo ID de Flip y que no esté abierto).
2. **Capturar Estado del Disparador:** Se vuelve a capturar la posición actual del disparador `Flip.getState(origin)`.
3. **Animar con `Flip.to`:** Se ejecuta la animación para llevar el `dialog` de vuelta a la posición y tamaño del disparador:
   - **Target:** El elemento `dialog`.
   - **Scale:** `true`.
   - **Duración:** `0.7` segundos.
   - **Curva custom (Ease):** El mismo `CustomEase` elástico utilizado en la apertura.
   - **Clase temporal de CSS:** Se añade la clase `.pretty-modal-closing` durante la animación para correr los efectos de desvanecimiento, difuminado y deformación (border-radius).
   - **Al finalizar (`onComplete`):**
     - Limpiar los estilos inline inyectados por Flip en el modal (`dialog.removeAttribute('style')` o resetear estilos inline).
     - Cerrar el modal de manera nativa llamando a `dialog.close()`.

---

## 4. Estilos CSS Necesarios

Para lograr los efectos ópticos de difuminado, suavizado y deformación del modal, se deben definir las siguientes clases y animaciones CSS en la hoja de estilos global o en el CSS del componente:

```css
/* Animación de Entrada */
.pretty-modal-opening {
    animation: pretty-modal-opening 500ms cubic-bezier(.56, .27, 0, 1) forwards;
}

@keyframes pretty-modal-opening {
    from {
        opacity: 0;
        filter: blur(8px);
    }
    to {
        opacity: 1;
        filter: blur(0px);
    }
}

/* Animación de Salida (Combina 3 efectos concurrentes) */
.pretty-modal-closing {
    animation: 
        pretty-modal-closing-border-radius 500ms cubic-bezier(.56, .27, 0, 1) forwards, 
        pretty-modal-closing-blur 500ms cubic-bezier(.37, .35, 0, 1) forwards, 
        pretty-modal-closing-fade 700ms cubic-bezier(.56, .27, 0, 1) forwards;
}

/* 1. Modificar el radio de borde para simular que colapsa como un botón redondo */
@keyframes pretty-modal-closing-border-radius {
    to { 
        border-radius: 400px; 
    }
}

/* 2. Aplicar desenfoque progresivo al cerrar */
@keyframes pretty-modal-closing-blur {
    0% { 
        filter: blur(0); 
    }
    100% { 
        filter: blur(32px); 
    }
}

/* 3. Desvanecer opacidad */
@keyframes pretty-modal-closing-fade {
    from { 
        opacity: 1; 
    }
    to { 
        opacity: 0; 
    }
}
```

---

## 5. Guía de Implementación en React

Para que una IA o programador traduzca esto a React, debe considerar los siguientes puntos arquitectónicos:

### Alternativas de Diseño en React

1. **Opción A: Hook personalizado (`usePrettyModal`)**
   - El hook debe devolver referencias a asignar al modal y métodos para abrir y cerrar.
   - El método `open` debe recibir el evento del click (`event`) o la referencia del botón (`triggerRef`) para poder capturar su estado inicial con `Flip.getState(event.currentTarget)`.

2. **Opción B: Componente de Contexto (`<PrettyModalProvider>`)**
   - Útil si se quieren disparar modales desde múltiples botones distantes en el árbol de componentes.
   - Guarda el `activeTrigger` en el estado de React.

### Ciclo de Vida e Integración con GSAP
- **Uso de refs:** En lugar de hacer consultas directas al DOM con `document.getElementById`, se deben usar `useRef` para apuntar de forma segura al elemento `<dialog>` y a los botones disparadores en React.
- **`useGSAP` o `useLayoutEffect`:** Es altamente recomendado usar la biblioteca `@gsap/react` y su hook `useGSAP()` o, en su defecto, un `useLayoutEffect` para asegurar que el registro de plugins y la medición de layouts de Flip ocurran justo antes de que el navegador pinte en pantalla.
- **Acceso al evento de click:** El método para abrir debe recibir el evento nativo/sintético de React para extraer `event.currentTarget` (el botón disparador) y pasar su referencia a `Flip.getState()`.

### Ejemplo de Estructura de Referencia para la IA en React:

```jsx
import React, { useRef } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(Flip, CustomEase);

export function ReactPrettyModal() {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null); // O pasar el target dinámicamente

  const openModal = (e) => {
    const dialog = dialogRef.current;
    const trigger = e.currentTarget;

    if (!dialog || !trigger) return;

    // Asignar el mismo identificador único de Flip
    const flipId = "modal-flip-id";
    dialog.dataset.flipId = flipId;
    trigger.dataset.flipId = flipId;

    // 1. Capturar estado del trigger
    const originState = Flip.getState(trigger);

    // 2. Mostrar dialog
    dialog.showModal();

    // 3. Animar desde el estado inicial capturado
    Flip.from(originState, {
      targets: dialog,
      scale: true,
      ease: CustomEase.create("custom", "M0,0 C0.305,0.206 0.116,0.567 0.3,0.8 0.394,0.921 0.491,1 1,1"),
      toggleClass: 'pretty-modal-opening',
      duration: 0.7,
    });
  };

  const closeModal = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const flipId = dialog.dataset.flipId;
    const trigger = document.querySelector(`[data-flip-id="${flipId}"]:not([open])`);

    if (!trigger) {
      // Cierre básico de respaldo si no encuentra el trigger
      dialog.close();
      return;
    }

    // 1. Capturar estado del trigger destino
    const originState = Flip.getState(trigger);

    // 2. Animar modal hacia el trigger
    Flip.to(originState, {
      targets: dialog,
      scale: true,
      ease: CustomEase.create("custom", "M0,0 C0.305,0.206 0.116,0.567 0.3,0.8 0.394,0.921 0.491,1 1,1"),
      toggleClass: 'pretty-modal-closing',
      duration: 0.7,
      onComplete: () => {
        dialog.removeAttribute('style');
        dialog.close();
      }
    });
  };

  return (
    <div>
      <button onClick={openModal}>Abrir Modal</button>

      <dialog ref={dialogRef} className="my-dialog-styles">
        <h2>Hola desde React</h2>
        <button onClick={closeModal}>Cerrar</button>
      </dialog>
    </div>
  );
}
```
