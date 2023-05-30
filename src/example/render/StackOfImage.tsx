import { useEffect, useRef } from "react";

import * as cornerstone from "cornerstone-core";

import SectionWrap from "../components/common/SectionWrap";
import { UseCornerstone } from "../models/cornerstone";

export default function StackOfImage({
  useCornerstoneProps,
}: {
  useCornerstoneProps: UseCornerstone;
}) {
  const { imageIndex, itemSrcArray, setImageIndex } = useCornerstoneProps;
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // init
    const element = elementRef.current;
    if (!element) throw new Error("ref가 존재하지 않습니다.");

    cornerstone.enable(element, {
      renderer: "webgl",
    });

    const imageStack = {
      currentImageIdIndex: imageIndex,
      imageIds: itemSrcArray,
    };

    // load
    const loadImage = async (index: number) => {
      try {
        cornerstone.loadImage(imageStack.imageIds[index]).then((image) => {
          cornerstone.displayImage(element, image);
        });
      } catch (error) {
        console.error("Error loading DICOM image:", error);
      }
    };

    loadImage(imageIndex);

    return () => {
      cornerstone.disable(element);
    };
  }, [imageIndex]);

  // 핸들러
  const buttonClickHandler = (index: number) => {
    setImageIndex(index);
  };

  return (
    <SectionWrap title="Image Stack">
      <div className="button-box flex flex-wrap gap-2 justify-center mb-4">
        {itemSrcArray.map((e, i) => (
          <button
            key={e}
            className={`w-4 h-4 rounded-full text-xs ${
              i === imageIndex ? "bg-cyan-300" : ""
            }`}
            onClick={() => buttonClickHandler(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div
        id="content"
        ref={elementRef}
        className="w-[600px] h-[300px] mx-auto border-cyan-400 border-spacing-2 bg-black"
      ></div>
    </SectionWrap>
  );
}
