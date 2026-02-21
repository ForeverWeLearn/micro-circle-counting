<script lang="ts">
  import * as Field from "$lib/components/ui/field";
  import { Slider } from "$lib/components/ui/slider";
  import { store } from "@/store.svelte";
  import { getGrayscale, runThresholdDescent } from "@/utils";
  import { onMount } from "svelte";

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let isProcessing = $state(false);
  let renderId = 0;

  onMount(() => {
    ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  });

  function renderAndProcess() {
    if (!store.image) {
      return;
    }

    canvas.width = store.image.width;
    canvas.height = store.image.height;
    ctx.drawImage(store.image, 0, 0);

    isProcessing = true;
    setTimeout(() => {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const gray = getGrayscale(imgData);

      store.circles = runThresholdDescent(gray, canvas.width, canvas.height, {
        minThreshold: store.threshold[0],
        maxThreshold: store.threshold[1],
        step: store.step,
        radius: store.radius,
        overlapLimit: store.overlap,
      });

      drawResults();
      isProcessing = false;
    }, 10);
  }

  function drawResults() {
    if (!store.image) {
      return;
    }

    ctx.drawImage(store.image, 0, 0);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#00ff00";
    ctx.fillStyle = "#00ff00";
    ctx.font = "12px monospace";

    store.circles.forEach((circle, i) => {
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, store.radius, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  function triggerRedraw() {
    clearTimeout(renderId);
    renderId = setTimeout(() => {
      renderAndProcess();
    }, 100);
  }

  $effect(() => {
    store.image;
    triggerRedraw();
  });
</script>

<div class="min-h-full w-screen flex flex-col items-center p-4 gap-8 xl:flex-row sm:p-8">
  <aside class="flex flex-col gap-8 w-sm max-w-full">
    <Field.Field>
      <Field.Label>Radius: {store.radius}</Field.Label>
      <Slider
        type="single"
        bind:value={store.radius}
        onValueChange={triggerRedraw}
        min={1}
        max={50}
        step={1}
        class="mt-2 w-full"
        aria-label="Radius"
      />
    </Field.Field>

    <Field.Field>
      <Field.Label
        >Threshold: {store.threshold[0]} - {store.threshold[1]}</Field.Label
      >
      <Slider
        type="multiple"
        bind:value={store.threshold}
        onValueChange={triggerRedraw}
        min={60}
        max={255}
        step={5}
        class="mt-2 w-full"
        aria-label="Threshold"
      />
    </Field.Field>

    <div class="flex items-center gap-2">
      <Field.Field>
        <Field.Label>Step: {store.step}</Field.Label>
        <Slider
          type="single"
          bind:value={store.step}
          onValueChange={triggerRedraw}
          min={1}
          max={10}
          step={1}
          class="mt-2 w-full"
          aria-label="Step"
        />
      </Field.Field>

      <Field.Field>
        <Field.Label>Overlap: {store.overlap}</Field.Label>
        <Slider
          type="single"
          bind:value={store.overlap}
          onValueChange={triggerRedraw}
          min={0}
          max={1}
          step={0.01}
          class="mt-2 w-full"
          aria-label="Overlap Limit"
        />
      </Field.Field>
    </div>

    <p class="text-center text-4xl font-bold sm:text-8xl">{store.circles.length}</p>
  </aside>

  <main class="border-none rounded-xl grow max-w-full flex flex-col p-0 justify-center sm:border sm:p-2">
    <canvas
      bind:this={canvas}
      class={[
        "rounded-lg bg-gray-100",
        isProcessing ? "brightness-50" : "brightness-100",
      ]}
    >
    </canvas>
  </main>
</div>
