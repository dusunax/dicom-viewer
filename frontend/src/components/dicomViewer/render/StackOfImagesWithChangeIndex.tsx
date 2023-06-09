import { useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";

import * as cornerstone from "cornerstone-core";
//@ts-ignore
import * as cornerstoneTools from "cornerstone-tools";

import SectionWrap from "../components/common/SectionWrap";
import useCornerstone from "../hooks/useCornerstone";

export default function StackOfImagesWithChangeIndex() {
  const { itemSrcArray, ITEM_LENGTH } = useCornerstone();
  const elementRef = useRef<HTMLDivElement | null>(null);

  // 컴포넌트 UI에 사용할 state
  const [imageIndex, setImageIndex] = useState(0);
  const rowLimit = 10;

  // 마우스 휠 이벤트 핸들러 함수
  const handleMouseWheel = (
    event: globalThis.WheelEvent,
    element: HTMLDivElement
  ) => {
    event.preventDefault();

    const delta = Math.max(-1, Math.min(1, event.deltaY)); // 휠 움직임 방향 결정
    const move = delta * 1; // 이동 거리 결정

    setImageIndex((prev) => {
      const newIndex = prev + move;

      if (newIndex >= 0 && newIndex < ITEM_LENGTH) {
        return newIndex;
      } else {
        return prev;
      }
    });
  };

  useEffect(() => {
    // init
    const element = elementRef.current;
    if (!element) throw new Error("ref가 존재하지 않습니다.");

    cornerstone.disable(element);
    cornerstone.enable(element, {
      renderer: "webgl",
    });

    cornerstoneTools.init();

    const synchronizer = new cornerstoneTools.Synchronizer(
      "stackOfImageWithTools",
      cornerstoneTools.updateImageSynchronizer
    );

    const imageStack = {
      currentImageIdIndex: imageIndex,
      imageIds: itemSrcArray,
    };

    // load
    const loadImage = async () => {
      try {
        cornerstone.loadImage(imageStack.imageIds[imageIndex]).then((image) => {
          cornerstone.displayImage(element, image);

          synchronizer.add(element);
          cornerstoneTools.addStackStateManager(element, [
            "stack",
            "crosshairs",
          ]);
          cornerstoneTools.addToolState(element, "stack", imageStack);
        });
      } catch (error) {
        console.error("Error loading DICOM image:", error);
      }
    };

    loadImage();

    // 스크롤 시 index 변화
    element.addEventListener(
      "wheel",
      (event: globalThis.WheelEvent) =>
        element && handleMouseWheel(event, element)
    );

    // 키 이벤트 리스너 등록
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cornerstone.disable(element);

      // 컴포넌트 unmount시, 이벤트 리스너 제거
      element?.removeEventListener(
        "wheel",
        (event) => element && handleMouseWheel(event, element)
      );

      // 컴포넌트 언마운트 시, 키 이벤트 리스너 제거
      document?.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // imageIndex 값이 바뀔 때, display 이미지를 load합니다.
  useEffect(() => {
    cornerstone.loadImage(itemSrcArray[imageIndex]).then((image) => {
      const element = elementRef.current;
      if (!element) throw new Error("ref가 존재하지 않습니다.");

      debounce(() => {
        cornerstone.displayImage(element, image);
      }, 100)();
    });
  }, [imageIndex]);

  /** input의 값이 변할 때, 0 ~ itemLength 인덱스의 이미지를 출력합니다. */
  const inputChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numIndex = Number(e.target.value);

    if (numIndex >= 0 && numIndex < ITEM_LENGTH) {
      setImageIndex(numIndex);
      cornerstone.loadImage(itemSrcArray[imageIndex]);
    }
  };

  // 키 이벤트
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      // 좌측 키를 눌렀을 때
      setImageIndex((prevIndex) => {
        const newIndex = prevIndex > 0 ? prevIndex - 1 : prevIndex;
        return newIndex;
      });
    } else if (event.key === "ArrowRight") {
      // 우측 키를 눌렀을 때
      setImageIndex((prevIndex) => {
        const newIndex =
          prevIndex + 1 < itemSrcArray.length ? prevIndex + 1 : prevIndex;
        return newIndex;
      });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();

      setImageIndex((prevIndex) => {
        const newIndex =
          prevIndex - rowLimit + 1 > 0 ? prevIndex - rowLimit : prevIndex;
        return newIndex;
      });
    } else if (event.key === "ArrowDown") {
      event.preventDefault();

      setImageIndex((prevIndex) => {
        const newIndex =
          prevIndex + rowLimit < itemSrcArray.length
            ? prevIndex + rowLimit
            : prevIndex;
        return newIndex;
      });
    }
  };

  return (
    <SectionWrap title="Image Stack: Change input values or scroll for Indexing">
      <div className="button-box flex gap-4 justify-center mb-4">
        <input
          type="range"
          name="progress"
          id="progress"
          className="w-[500px]"
          value={imageIndex}
          onChange={(e) => inputChangeHandler(e)}
          min={0}
          max={ITEM_LENGTH}
        />

        <input
          id="index-number-1"
          type="number"
          value={imageIndex}
          onChange={inputChangeHandler}
          className={`w-16 h-10 pl-4 shadow-lg border-2 border-gray-600 rounded-lg outline-none`}
        />
      </div>

      <div
        id="contentOne"
        ref={elementRef}
        className="w-[700px] h-[400px] mx-auto border-cyan-400 border-spacing-2 bg-black"
      ></div>
    </SectionWrap>
  );
}
