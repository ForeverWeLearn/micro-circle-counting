<script lang="ts">
  import Annotation from "@/components/Annotation.svelte";
  import * as Tabs from "$lib/components/ui/tabs";
  import { store } from "@/store.svelte";
  import Detection from "@/components/Detection.svelte";
  import { asset } from "$app/paths";

  let sampleImg = asset("/sample.jpg");
  let detectedImg = asset("/detected.jpg");
  let annotatedImg = asset("/annotated.jpg");

  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        store.image = img;
      };
    };
    reader.readAsDataURL(file);
  }
</script>

{#if store.image === null}
  <div
    class="min-h-screen flex flex-col gap-16 items-center justify-center p-8"
  >
    <label
      for="uploadFile1"
      class="bg-white font-semibold text-base rounded max-w-md h-52 flex flex-col items-center justify-center cursor-pointer border-2 border-gray-300 border-dashed mx-auto px-8"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-11 mb-3 fill-gray-700"
        viewBox="0 0 32 32"
      >
        <path
          d="M23.75 11.044a7.99 7.99 0 0 0-15.5-.009A8 8 0 0 0 9 27h3a1 1 0 0 0 0-2H9a6 6 0 0 1-.035-12 1.038 1.038 0 0 0 1.1-.854 5.991 5.991 0 0 1 11.862 0A1.08 1.08 0 0 0 23 13a6 6 0 0 1 0 12h-3a1 1 0 0 0 0 2h3a8 8 0 0 0 .75-15.956z"
          data-original="#000000"
        />
        <path
          d="M20.293 19.707a1 1 0 0 0 1.414-1.414l-5-5a1 1 0 0 0-1.414 0l-5 5a1 1 0 0 0 1.414 1.414L15 16.414V29a1 1 0 0 0 2 0V16.414z"
          data-original="#000000"
        />
      </svg>
      Upload image

      <input
        type="file"
        accept="image/*"
        onchange={handleFileUpload}
        id="uploadFile1"
        class="hidden"
      />
      <p class="text-xs font-medium mt-2">
        PNG, JPG SVG, WEBP, and GIF are Allowed.
      </p>
    </label>
    <div class="flex flex-col gap-4 sm:flex-row">
      <figure>
        <img class="w-sm max-w-full rounded-md" src={sampleImg} alt="Sample" />
        <figcaption class="italic text-sm text-center mt-2">
          1. Upload image
        </figcaption>
      </figure>
      <figure>
        <img
          class="w-sm max-w-full rounded-md"
          src={detectedImg}
          alt="Detected"
        />
        <figcaption class="italic text-sm text-center mt-2">
          2. Auto detect
        </figcaption>
      </figure>
      <figure>
        <img
          class="w-sm max-w-full rounded-md"
          src={annotatedImg}
          alt="Annotated"
        />
        <figcaption class="italic text-sm text-center mt-2">
          3. Manual editing
        </figcaption>
      </figure>
    </div>
  </div>
{:else}
  <Tabs.Root value="detection" class="w-screen pt-8">
    <Tabs.List class="min-w-xs w-[50%] max-w-md mx-auto">
      <Tabs.Trigger value="detection">Detection</Tabs.Trigger>
      <Tabs.Trigger value="annotation">Annotation</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content class="grow flex items-stretch" value="detection">
      <Detection />
    </Tabs.Content>
    <Tabs.Content value="annotation">
      <Annotation />
    </Tabs.Content>
  </Tabs.Root>
{/if}
