<script lang="ts">
  import * as Field from "$lib/components/ui/field";
  import { Button } from "@/components/ui/button";
  import { Checkbox } from "@/components/ui/checkbox";
  import { Label } from "@/components/ui/label";
  import * as NativeSelect from "@/components/ui/native-select";
  import { Slider } from "@/components/ui/slider";
  import { store } from "@/store.svelte";
  import { onMount } from "svelte";

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  let styleMode = $state("randomStrip");
  let currentSortOrder = $state("vertical");
  let showNumbers = $state(true);
  let stripStep = $state(10);
  let globalAlpha = $state(30);
  let colorPalette = $state<string[]>([]);

  let isDragging = false;
  let draggedId: string | null = null;
  let dragOffset = { x: 0, y: 0 };

  let sortedCircles = $derived.by(() => {
    const sorted = [...store.circles];
    const tol = store.radius;
    if (currentSortOrder === "horizontal") {
      sorted.sort((a, b) =>
        Math.abs(a.y - b.y) < tol ? a.x - b.x : a.y - b.y,
      );
    } else if (currentSortOrder === "vertical") {
      sorted.sort((a, b) =>
        Math.abs(a.x - b.x) < tol ? a.y - b.y : a.x - b.x,
      );
    }
    return sorted;
  });

  onMount(() => {
    if (canvas) {
      ctx = canvas.getContext("2d");
    }
    generatePalette();
  });

  $effect(() => {
    store.circles;
    draw();
  });

  function generatePalette() {
    const palette: string[] = [];
    for (let i = 0; i < 50; i++) {
      const hue = (i * 137.5) % 360;
      palette.push(`hsl(${hue}, 70%, 50%)`);
    }
    colorPalette = palette;
    draw();
  }

  function getMousePos(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function onMouseDown(e: MouseEvent) {
    if (e.button !== 0) {
      return;
    }

    const pos = getMousePos(e);
    const idx = store.circles.findIndex(
      (c) => Math.hypot(pos.x - c.x, pos.y - c.y) <= store.radius,
    );

    if (idx !== -1) {
      isDragging = true;
      draggedId = store.circles[idx].id;
      dragOffset = {
        x: pos.x - store.circles[idx].x,
        y: pos.y - store.circles[idx].y,
      };
    } else {
      store.circles = [...store.circles, { ...pos, id: crypto.randomUUID() }];
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging || !draggedId) return;
    const pos = getMousePos(e);
    store.circles = store.circles.map((c) =>
      c.id === draggedId
        ? { ...c, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
        : c,
    );
  }

  function onMouseUp() {
    isDragging = false;
    draggedId = null;
  }

  function onRightClick(e: MouseEvent) {
    e.preventDefault();
    const pos = getMousePos(e);
    const idx = store.circles.findIndex(
      (c) => Math.hypot(pos.x - c.x, pos.y - c.y) <= store.radius,
    );
    if (idx !== -1) {
      const newCircles = [...store.circles];
      newCircles.splice(idx, 1);
      store.circles = newCircles;
    }
  }

  function draw() {
    if (!store.image || !ctx || !canvas) {
      return;
    }

    canvas.width = store.image.width;
    canvas.height = store.image.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (store.image) {
      ctx.drawImage(store.image, 0, 0);
    }

    const safeStep = Math.max(1, stripStep || 1);

    sortedCircles.forEach((c, index) => {
      let color = "#00d4ff";

      if (styleMode === "randomStrip" && colorPalette.length > 0) {
        const groupIdx = Math.floor(index / safeStep);
        color = colorPalette[groupIdx % colorPalette.length];
      } else if (styleMode === "twoStrip") {
        color = Math.floor(index / 10) % 2 === 1 ? "#ffc107" : "#00d4ff";
      }

      if (!ctx) {
        return;
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, store.radius, 0, Math.PI * 2);

      ctx.globalAlpha = globalAlpha / 100;
      ctx.fillStyle = color;
      ctx.fill();

      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (showNumbers) {
        const size = Math.max(10, Math.floor(store.radius * 0.7));
        ctx.font = `bold ${size}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.strokeText((index + 1).toString(), c.x, c.y);
        ctx.fillText((index + 1).toString(), c.x, c.y);
      }
      ctx.restore();
    });

    if (store.image) {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.roundRect(canvas.width - 80, 10, 70, 45, 8);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${store.circles.length}`, canvas.width - 25, 38);
    }
  }

  function exportPng() {
    if (!store.image) {
      return;
    }

    const link = document.createElement("a");
    link.download = `annotated_img.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }
</script>

<svelte:window onmousemove={onMouseMove} onmouseup={onMouseUp} />

<div
  class="min-h-full w-screen flex flex-col items-center p-4 gap-8 xl:flex-row sm:p-8"
>
  <aside class="flex flex-col gap-8 w-sm max-w-full">
    <div class="flex gap-2 *:grow">
      <NativeSelect.Root bind:value={currentSortOrder}>
        <NativeSelect.Option value="default">Default Order</NativeSelect.Option>
        <NativeSelect.Option value="horizontal"
          >Horizontal Scan</NativeSelect.Option
        >
        <NativeSelect.Option value="vertical">Vertical Scan</NativeSelect.Option
        >
      </NativeSelect.Root>

      <NativeSelect.Root bind:value={styleMode}>
        <NativeSelect.Option value="randomStrip">
          Random Strip
        </NativeSelect.Option>
        <NativeSelect.Option value="single">Single Color</NativeSelect.Option>
        <NativeSelect.Option value="twoStrip">Two Strip</NativeSelect.Option>
      </NativeSelect.Root>
    </div>

    <Field.Field>
      <Field.Label>Radius: {store.radius}</Field.Label>
      <Slider type="single" min={1} max={100} bind:value={store.radius} />
    </Field.Field>

    {#if styleMode === "randomStrip"}
      <div class="flex flex-col gap-8">
        <Field.Field>
          <Field.Label>Strip Step: {stripStep}</Field.Label>
          <Slider type="single" min={1} max={50} bind:value={stripStep} />
        </Field.Field>
        <Field.Field>
          <Field.Label>Fill Opacity: {globalAlpha}</Field.Label>
          <Slider type="single" min={0} max={100} bind:value={globalAlpha} />
        </Field.Field>
        <!-- <Button onclick={generatePalette}>Shuffle</Button> -->
      </div>
    {/if}

    <div class="flex items-center gap-3">
      <Checkbox class="cursor-pointer" id="terms" bind:checked={showNumbers} />
      <Label class="cursor-pointer" for="terms">Show ID Labels</Label>
    </div>

    <div class="flex gap-2 *:grow">
      <!-- <Button onclick={clearAll}>Clear All</Button> -->
      <Button onclick={exportPng}>Save PNG</Button>
    </div>

    <p class="italic text-sm text-center">
      Left-click to add, Drag to move, Right-click to delete.
    </p>
  </aside>

  <main
    class="border-none rounded-xl grow max-w-full flex flex-col p-0 justify-center sm:border sm:p-2"
  >
    <canvas
      bind:this={canvas}
      onmousedown={onMouseDown}
      oncontextmenu={onRightClick}
      class="rounded-lg cursor-pointer bg-gray-100"
    ></canvas>
  </main>
</div>
