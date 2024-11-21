import React, { useEffect, useState } from "react";
import { FaFileDownload } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import imageUrls from "../../src/links/image_path.json";

const IdListSubmit = ({ listId, ClearID}) => {
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    const answerSaved = localStorage.getItem("answerSaved");
    if (answerSaved) {
      setAnswer(answerSaved);
    }
  }, []);

  const DownloadID = () => {
    let savedIds = [];
    if (localStorage.getItem("submitIds")) {
      savedIds = JSON.parse(localStorage.getItem("submitIds"));
      if (savedIds.length === 0) return;
    } else {
      return;
    }
    const element = document.createElement("a");
    const combinedArray = savedIds.map((id, index) => {
      const videoName = imageUrls[id].split('/')[4];
      const imageName = imageUrls[id].split('/').pop().split('.')[0];
      return answer ? `${videoName}, ${imageName}, ${answer}` : `${videoName}, ${imageName}`;
    });
    const file = new Blob([combinedArray.join("\n")], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "IDSUBMIT.csv";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  const changeAnswer = (event) => {
    setAnswer(event.target.value);
    localStorage.setItem("answerSaved", event.target.value);
  };
  return (
    <div className="border-2 fixed top-25 right-4 bg-white rounded-lg shadow-lg z-50 w-72">
      <div className="bg-slate-200 rounded-t-lg py-2 px-6 flex justify-between border-b-2">
        <button className="text-sky-500	transition-all hover:text-sky-900">
          <FaFileDownload size={20} onClick={DownloadID} />
        </button>
        <button
          className="text-red-500 transition-all hover:text-red-900"
          onClick={() => ClearID("all")}
        >
          <MdDeleteOutline size={25} />
        </button>
      </div>
      <div className="px-4 py-2">
        <input type="text" className="border-2" value={answer} onChange={changeAnswer}
        />
      </div>
      {listId.length > 0 ? (
        <div className="max-h-96 overflow-y-auto pl-4 ">
          {listId.map((item, idx) => (
            <div className="flex justify-between p-3 pr-6 border-b last:border-none">
              <span key={idx} className="whitespace-nowrap overflow-hidden text-ellipsis w-full">
                <strong>{item}:</strong> {imageUrls[item].split('/')[4]}, {imageUrls[item].split('/').pop().split('.')[0]}
              </span>
              <button
                className="text-red-500 transition-all hover:text-red-900"
                onClick={() => ClearID(item)}
              >
                <MdDeleteOutline size={20} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-10"></div>
      )}
    </div>
  );
};

export default IdListSubmit;
