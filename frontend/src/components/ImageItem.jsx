import { BiDislike, BiLike, BiSolidDislike, BiSolidLike } from "react-icons/bi";
import { useState, useEffect } from "react";
import ImageShow from "./ImageShow";
import imageUrls from "../../src/links/image_path.json";

const ImageItem = ({ idImg, idx, isSelect, idxSelect, isLiked, onCheckBox, onLike, onClickImg, onUpdate }) => {
  const [isLike, setIsLike] = useState(isLiked);
  const [isChecked, setIsChecked] = useState(isSelect);
  const [showImageShow, setShowImageShow] = useState(false);
  const [urlImg, setUrlImg] = useState("")
  const [isLoaded, setIsLoaded] = useState(false);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  useEffect(() => {
    const url = imageUrls[idImg];
    setUrlImg("http://127.0.0.1:7000/" + url.slice(1));
  }, [idImg]);

  const handleImageClick = () => {
    setShowImageShow(!showImageShow);
  };

  const handleLike = (value) => {
    if (value === isLike) {
      setIsLike(0);
      onLike(0, idx);
    } else {
      setIsLike(value);
      onLike(value, idx);
    }
  };

  const handleCheckBox = (idx) => {
    onCheckBox(idx);
    setIsChecked(!isChecked);
  };
  if (!isLoaded) return (
    <div className="">
      <img
        hidden
        src={urlImg}
        alt={idImg}
        className={
          idx === idxSelect ? "rounded-lg border-4 border-teal-500" : "border-4 hover:border-teal-500"
        }
        onLoad={handleImageLoad}
        onDoubleClick={handleImageClick}
        onClick={onClickImg}
      />
      <div
        role="status"
        className="m-1 space-y-8 animate-pulse md:space-y-0 md:space-x-8 rtl:space-x-reverse md:flex md:items-center"
      >
        <div className="flex items-center justify-center w-full h-32 bg-gray-300 rounded sm:w-96 dark:bg-gray-700">
          <svg
            className="w-10 h-10 text-gray-200 dark:text-gray-600"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 18"
          >
            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
          </svg>
        </div>
      </div>
    </div>
  )
  return (
    <div className="relative">
      <input
        type="checkbox"
        className="absolute top-0 left-0 mt-2 ml-2 cursor-pointer h-5 w-5 rounded-md"
        checked={isChecked}
        onChange={() => handleCheckBox(idx)}
      />
      <div className="absolute top-0 right-0 mt-2 mr-2 gap-2 flex">
        <button className="text-rose-500" onClick={() => handleLike(1)}>
          {isLike === 1 ? <BiSolidLike size={20}/> : <BiLike size={20}/>}
        </button>
        <button className="text-rose-500" onClick={() => handleLike(-1)}>
          {isLike === -1 ? <BiSolidDislike size={20}/> : <BiDislike size={20}/>}
        </button>
      </div>
      <img
        src={urlImg}
        alt={idImg}
        className={
          idx === idxSelect ? "rounded-lg border-4 border-teal-500" : "border-4 hover:border-teal-500"
        }
        onLoad={handleImageLoad}
        onDoubleClick={handleImageClick}
        onClick={onClickImg}
        // style={{ width: "auto", height: "120px" }}
      />
      {showImageShow && <ImageShow onClose={handleImageClick} idImg={idImg} url={urlImg} onUpdate={onUpdate}/>}
    </div>
  );
};

export default ImageItem;
