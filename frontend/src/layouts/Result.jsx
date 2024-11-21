import React, { useContext } from 'react';
import { SlReload } from "react-icons/sl";
import { GoHome } from "react-icons/go";
import { GrNotes } from "react-icons/gr";
import { RiSendPlane2Fill } from "react-icons/ri";
import { IoMdSearch } from "react-icons/io";
import ListImageResult from "../components/ListImageResult";
import { useState, useEffect } from "react";
import imageUrls from "../../src/links/image_path.json";
import timeStamp from "../../src/links/time_stamp.json";
import Swal from 'sweetalert2';

import { DataContext } from '../components/DataContext';

const Result = ({ result, onChangeDataRerank, K, onGoBack, onClear }) => {
  const [inputValue, setInputValue] = useState("");
  const [K1, setK] = useState(K);
  const [isShowIdlist, setIsShowIdlist] = useState(false);

  const { ids, setIds, dis, setDis } = useContext(DataContext);
  const username = "team55";
  const password = "jfYMHWgh99";
  useEffect(() => {
    setK(K);
  }, [K]);
  const btn_style =
    "text-teal-500 px-2 py-2 rounded-full transition-all hover:text-white hover:bg-teal-500";

  useEffect(() => {
    const idsList = [];
    const disList = [];
    for (const key in result) {
      idsList.push(result[key].ids);
      disList.push(result[key].distances);
    }
    setDis(disList);
    setIds(idsList);
  }, [result]);

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSetIds();
    }
  };
  const handleSetIds = () => {
    if (!inputValue) return;
    var values = [];
    const regex = /^(\d+,)*\d+$/;
    if (regex.test(inputValue)) {
      values = inputValue
        .split(",")
        .map((value) => parseInt(value.trim()))
        .filter((value) => value >= 0 && value <= Object.keys(imageUrls).length);
      values = [...new Set(values)];
    } else {
      for (const [key, value] of Object.entries(imageUrls)) {
        if (value.includes(inputValue)) {
          values.push(parseInt(key));
        }
      }
    }
    setIds([values]);
  };
  const handleClear = () => {
    setIsShowIdlist(false);
    setIds([]);
    onClear();
  };
  const ShowIdList = () => {
    setIsShowIdlist(!isShowIdlist);
  };
  const getsessionId = async () => {
    const url = "https://eventretrieval.one/api/v2/login";
    const body = { "username": username, "password": password };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.sessionId;
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const getevaluationID = async (sessionId) => {
    const url = `https://eventretrieval.one/api/v2/client/evaluation/list?session=${sessionId}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result[0].id;
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const getBody = () => {
    var savedIds = [];
    if (localStorage.getItem("submitIds")) {
      savedIds = JSON.parse(localStorage.getItem("submitIds"));
      if (savedIds.length === 0) return;
    } else {
      return "";
    }
    const videoName = imageUrls[savedIds[0]].split('/')[4];
    const frameTime = timeStamp[savedIds[0]];
    // const frameTime = "870000";
    var body = "";

    const answerSaved = localStorage.getItem("answerSaved");
    if (answerSaved) {
      const submitString = answerSaved + "-" + videoName + "-" + frameTime;
      body = {
        "answerSets": [
          {
            "answers": [
              {
                "text": submitString
              }
            ]
          }
        ]
      }
    }
    else
      body = {
        "answerSets": [
          {
            "answers": [
              {
                "mediaItemName": videoName,
                "start": frameTime,
                "end": frameTime
              }
            ]
          }
        ]
      };
    console.log(body);
    return body;
  }

  const submitResult = async () => {
    const sessionId = await getsessionId();
    const evaluationID = await getevaluationID(sessionId);

    const url = `https://eventretrieval.one/api/v2/submit/${evaluationID}?session=${sessionId}`;
    const body = getBody();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),

      });

      if (!response.ok) {
        const result = await response.json();
        showStatus(result.description, "");
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      showStatus(result.description, result.submission);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const showStatus = (status, submission) => {
    if (submission === "")
      Swal.fire({
        icon: 'warning',
        text: status,
        showConfirmButton: true,
      });
    else if (submission === "WRONG")
      Swal.fire({
        icon: 'error',
        title: submission,
        text: status,
        showConfirmButton: true,
      });
    else
      Swal.fire({
        icon: 'success',
        title: submission,
        text: status,
        showConfirmButton: true,
      });
  }
  return (
    <div className="px-6 py-4 flex-grow h-screen">
      <div className="flex flex-row gap-44 mb-3">
        <div className="flex gap-12">
          <button className={btn_style} onClick={onGoBack}>
            <SlReload size={30} />
          </button>
          <button className={btn_style}>
            <GoHome size={30} onClick={handleClear} />
          </button>
        </div>
        <div className="flex flex-row items-center border rounded-full px-3 border-teal-500 w-full">
          <input
            type="text"
            className="outline-none px-4 w-full "
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button className="hover:text-teal-500" onClick={handleSetIds}>
            <IoMdSearch size={25} />
          </button>
        </div>
        <div className="flex gap-12">
          <button
            className={
              !isShowIdlist
                ? btn_style
                : "px-2 py-2 rounded-full transition-all text-white bg-teal-500"
            }
          >
            <GrNotes size={30} onClick={ShowIdList} />
          </button>
          <button className={btn_style}>
            <RiSendPlane2Fill size={30} onClick={submitResult} />
          </button>
        </div>
      </div>

      {/*Two-dimensional array [stage][idx] -> idImg*/}
      <ListImageResult
        K={K1}
        onChangeDataRerank={onChangeDataRerank}
        ImageIdArr={ids}
        dis={dis}
        isShowIdlist={isShowIdlist}
      />
    </div>
  );
};
export default Result;
