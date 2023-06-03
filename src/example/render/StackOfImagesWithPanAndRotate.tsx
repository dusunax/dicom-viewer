import { useEffect, useRef } from "react";

import * as cornerstone from "cornerstone-core";
//@ts-ignore
import * as cornerstoneTools from "cornerstone-tools";

import { Layer, UseCornerstone } from "../models/cornerstone";

import SectionWrap from "../components/common/SectionWrap";

// ToolBox
export default function StackOfImagesWithPanAndRotate({
  useCornerstoneProps,
}: {
  useCornerstoneProps: UseCornerstone;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const { LEFT_MOUSE_TOOLS: leftMouseToolChain, itemLayers } =
    useCornerstoneProps;

  // 도구 설정
  const setToolsByName = (index: number) => {
    cornerstoneTools.addTool(leftMouseToolChain[index].func);

    if (index === 0) {
      cornerstoneTools.addTool(leftMouseToolChain[index].func);
      cornerstoneTools.setToolActive(leftMouseToolChain[index].name, {
        mouseButtonMask: 1,
      });
    } else {
      cornerstoneTools.addTool(leftMouseToolChain[index].func);
      cornerstoneTools.setToolPassive(leftMouseToolChain[index].name, {
        mouseButtonMask: 1,
      });
    }
  };

  /** 초기화 */
  async function init() {
    cornerstoneTools.init();

    const images = await loadImages(itemLayers[0]);

    images?.forEach((image, index) => {
      if (elementRef.current === null) return;

      const layer = itemLayers[index];

      if (layer && layer.options) {
        const layerId = cornerstone.addLayer(
          elementRef.current,
          image,
          layer.options
        );
        itemLayers[index].layerId = layerId;

        cornerstone.updateImage(elementRef.current);
      }
    });
  }

  /** 이미지를 비동기로 load & cache합니다. */
  async function loadImages(layer: Layer) {
    const promises: Promise<cornerstone.Image>[] = [];

    try {
      if (layer.options.visible) {
        layer.images.map((image) => {
          promises.push(cornerstone.loadAndCacheImage(image));
        });
      }
      return await Promise.all(promises);
    } catch (e) {
      console.error("Error loading images:", e);
      throw e;
    }
  }

  // 마우스 휠 이벤트 핸들러 함수
  const handleMouseWheel = (
    event: globalThis.WheelEvent,
    element: HTMLDivElement
  ) => {
    event.preventDefault();

    const delta = Math.max(-1, Math.min(1, event.deltaY)); // 휠 움직임 방향 결정

    const viewport = cornerstone.getViewport(element);
    if (!viewport) {
      return;
    }

    viewport.rotation += delta * 1; // 회전 각도 변경
    cornerstone.setViewport(element, viewport);
  };

  // mount시, rerender를 enable합니다.
  useEffect(() => {
    if (elementRef.current === null) {
      return;
    }

    cornerstone.enable(elementRef.current, {
      renderer: "webgl",
    });

    init();
    setToolsByName(0);

    // 이벤트 리스너 등록
    elementRef.current.addEventListener(
      "wheel",
      (event: globalThis.WheelEvent) =>
        elementRef.current && handleMouseWheel(event, elementRef.current)
    );

    return () => {
      // 컴포넌트 unmount시, 이벤트 리스너 제거
      elementRef.current?.removeEventListener(
        "wheel",
        (event) =>
          elementRef.current && handleMouseWheel(event, elementRef.current)
      );
    };
  }, []);

  return (
    <>
      <SectionWrap title="Image Stack With Tools: Drag to Pan & Scroll to Rotate">
        <ul className="my-2 flex gap-2 justify-center">
          <li
            className={`p-2 border-2 cursor-pointer hover:bg-slate-400 hover:text-slate-50 bg-slate-400 text-slate-50`}
          >
            {leftMouseToolChain[0].name}
          </li>
        </ul>

        <div
          id="contentOne"
          ref={elementRef}
          className="w-[600px] h-[300px] mx-auto border-cyan-400 border-spacing-2 bg-black"
        ></div>
      </SectionWrap>
    </>
  );
}
