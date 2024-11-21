import { useState, useEffect, useContext } from "react";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { ImYoutube2 } from "react-icons/im";
import SliderImage from "./SliderImage";
import YouTubeVideo from "./YouTuBeVideo";
import { RxReset } from "react-icons/rx";
import { IoMdSearch } from "react-icons/io";
import imageUrls from "../../src/links/image_path.json";

import { DataContext } from './DataContext';

const ImageShow = ({ idImg, onClose, url, onUpdate }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [NewShowIdImg, setNewShowIdImg] = useState(idImg);
  const [urlImg, setUrlImg] = useState(url)
  const [toggle, setToggle] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [submitId, setSubmitId] = useState([]);
  const [isSelected, setIsSelected] = useState(false);

  const { ids, setIds, dis, setDis } = useContext(DataContext);


  useEffect(() => {
    const url = imageUrls[NewShowIdImg];
    if(url)
      setUrlImg("http://127.0.0.1:7000/" + url.slice(1));
    else
    setUrlImg("");
  }, [NewShowIdImg]);

  useEffect(() => {
    const savedIds = localStorage.getItem("submitIds");
    if (savedIds) {
      const idsArray = JSON.parse(savedIds);
      setSubmitId(idsArray);
    }
  }, []);

  useEffect(() => {
    if (submitId.includes(NewShowIdImg)) {
      setIsSelected(true);
    } else {
      setIsSelected(false);
    }
  }, [submitId, NewShowIdImg]);

  const handleShowVideo = () => {
    setShowVideo(!showVideo);
  };

  const handleNewShowIdImg = (newId) => {
    setNewShowIdImg(newId);
  };
  const handleResetId = () => {
    setNewShowIdImg(idImg);
    setToggle(!toggle);
  };

  const handleCheckBox = (id) => {
    if(!isSelected){
      var savedIds = JSON.parse(localStorage.getItem("submitIds"));
      if (!savedIds.includes(id)) savedIds.push(id);
      localStorage.setItem("submitIds", JSON.stringify(savedIds));
      setIsSelected(true);
    }
    else{
      var savedIds = JSON.parse(localStorage.getItem("submitIds"));
      savedIds = savedIds.filter((item) => item !== id);
      localStorage.setItem("submitIds", JSON.stringify(savedIds));
      setIsSelected(false);
    }
    setSubmitId(savedIds);
    onUpdate();
  };

  const searchByImage = async (id) => {
    setIsLoading(true);
    const response = await fetch('http://127.0.0.1:7000/searchbyimg', {
      headers: {
        'Content-type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({ message: "." + imageUrls[id] })
    });
    const json = await response.json();
    setIds([json.ids]);
    setDis([json.dis]);
    setIsLoading(false);
    onClose();
  }
  return (
    <div
      className={`fixed flex flex-col top-0 left-0 right-0 bottom-0 pt-4 bg-black bg-opacity-75 z-50 cursor-${isLoading ? 'wait' : 'pointer'}`}
      onClick={onClose}
    >
      <button
        className="absolute top-2 right-5 text-white hover:text-teal-500"
        onClick={onClose}
      >
        <IoMdCloseCircleOutline size={50} />
      </button>
      <div
        className="max-w-3/4 relative flex flex-col items-center"
        onClick={onClose}
      >
        <div className="w-fit mb-4" onClick={(e) => e.stopPropagation()}>
          {!showVideo ? (
            <div className="relative">
              <input
                type="checkbox"
                className="absolute top-0 left-0 mt-2 ml-2 cursor-pointer h-8 w-8 rounded-md"
                checked={isSelected}
                onChange={() => handleCheckBox(NewShowIdImg)}
              />
              <img
                src={urlImg}
                alt={NewShowIdImg}
                style={{ width: "auto", height: "422px" }}
              />
            </div>

          ) : (
            <YouTubeVideo idImg={NewShowIdImg} />
          )}
          <div className="flex justify-between mt-2">
            <button
              className="text-red-500 rounded-lg px-4 bg-white mt-2 "
              onClick={handleShowVideo}
            >
              <ImYoutube2 size={40} />
            </button>
            {!showVideo && (
              <button
                className="text-rose-500 rounded-lg px-4 bg-white mt-2 hover:text-white hover:bg-rose-500"
                onClick={() => searchByImage(NewShowIdImg)}
              >
                <IoMdSearch size={40} />
              </button>
            )}
            {!showVideo && (
              <button
                className="text-rose-500 rounded-lg px-4 bg-white mt-2 hover:text-white hover:bg-rose-500"
                onClick={handleResetId}
              >
                <RxReset size={40} />
              </button>
            )}
          </div>
        </div>
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-row justify-center"
      >
        <SliderImage
          idImg={NewShowIdImg}
          key={toggle}
          onArrow={handleNewShowIdImg}
        />
      </div>
    </div>
  );
};

export default ImageShow;
