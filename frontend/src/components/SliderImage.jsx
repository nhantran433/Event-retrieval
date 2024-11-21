import React, { useState, useEffect } from "react";
import imageUrls from "../../src/links/image_path.json";
import { MdArrowCircleLeft } from "react-icons/md";
import { MdArrowCircleRight } from "react-icons/md";

const SliderImage = ({ idImg, onArrow }) => {
  const [ImgIdArr, setImgIdArr] = useState([
    idImg - 2,
    idImg - 1,
    idImg,
    idImg + 1,
    idImg + 2,
  ]);
  const [urlImgArr, setUrlImgArr] = useState(["", "", "", "", ""]);

  useEffect(() => {
    const newUrls = [];
    for (let i = 0; i < ImgIdArr.length; i++) {
      if (imageUrls[ImgIdArr[i]])
        newUrls.push("http://127.0.0.1:7000/" + imageUrls[ImgIdArr[i]].slice(1));
      else newUrls.push("");
    }
    setUrlImgArr(newUrls);
  }, [ImgIdArr]);

  const ArrowRight = () => {
    const newImgIdArr = ImgIdArr.map((imgId) => imgId + 1);
    setImgIdArr(newImgIdArr);
    onArrow(newImgIdArr[2]);
  };
  const ArrowLeft = () => {
    const newImgIdArr = ImgIdArr.map((imgId) => imgId - 1);
    setImgIdArr(newImgIdArr);
    onArrow(newImgIdArr[2]);
  };
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        ArrowLeft();
      } else if (event.key === "ArrowRight") {
        ArrowRight();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [ImgIdArr]);
  const onClickImg = (id) => {
    const dis = id - ImgIdArr[2];
    const newImgIdArr = ImgIdArr.map((imgId) => imgId + dis);
    setImgIdArr(newImgIdArr);
    onArrow(newImgIdArr[2]);
  };
  return (
    <div className="flex flex-row">
      <button onClick={ArrowLeft} className="hover:text-teal-500">
        <MdArrowCircleLeft size={60} />
      </button>
      {ImgIdArr.map((item, idx) => (
        <div
          key={`slider${idx}`}
          className="px-2 py-1 cursor-pointer"
          onClick={() => onClickImg(ImgIdArr[idx])}
        >
          <img
            src={urlImgArr[idx]}
            alt={ImgIdArr[idx]}
            className={
              idx === 2 ? "rounded-lg border-4 border-teal-500" : "hover:border-4 hover:border-teal-500"
            }
            style={{ width: "auto", height: "122px" }}
          />
        </div>
      ))}
      <button onClick={ArrowRight} className="hover:text-teal-500">
        <MdArrowCircleRight size={60} />
      </button>
    </div>
  );
};
export default SliderImage;
