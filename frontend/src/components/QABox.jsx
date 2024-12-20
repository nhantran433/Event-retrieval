import React, { useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge';
import { IoChatbubblesOutline } from "react-icons/io5";
import IconButton from './IconButton';
import { FaRegTrashCan } from "react-icons/fa6";
import { IoSaveOutline } from "react-icons/io5";

const QABox = ({className}) => {
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false);
  const [videoNames, setVideoNames] = useState([]);
  const inputRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const value = inputRef.current.value;
    try {
      setAnswer('');
      setLoading(true);
      const res =  await fetch('http://127.0.0.1:7000/qa', {
        headers: {
          'Content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({message: value})
      });
      setLoading(false);
      const decoded = await res.json();
      setAnswer(decoded.data[0]);
      const videoNames = [];
      decoded.data[1].forEach((video => {
        videoNames.push(video.metadata.video);
      }))
      setVideoNames(videoNames);
    } catch(e) {
      setLoading(false);
      alert("Have error when answering your question")
    }
  }
  
  const handleDelete = () => {
    inputRef.current.value = '';
    setAnswer('');
    setVideoNames([]);
  }

  return (
    <div className={twMerge(
      "bg-slate-50 rounded-md p-4 relative",
      className
    )}>
      <IconButton onClick={handleDelete} label="Delete" className={`absolute top-3 right-4 text-gray-600 hover:text-red-500 ${loading ? 'pointer-events-none' : ''}`}>
      <FaRegTrashCan className='text-xs' />
      </IconButton>
      <div className='font-medium flex text-teal-500 items-center gap-2 mb-4'>
        <IoChatbubblesOutline className='size-6'/>
        <p>Q&A</p>
      </div>
      <form onSubmit={handleSubmit}>
        <input ref={inputRef} className='px-4 py-1 rounded-lg w-full focus:outline-none ring-2 ring-slate-300 focus:ring-teal-500' placeholder='Enter your question here'  name='qa' required></input>
      </form>
      <div className='mt-4'>
        {loading && <div className="flex w-full justify-center" role="status">
            <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-teal-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span class="sr-only">Loading...</span>
        </div>}
        {answer && <div className='w-[80%] bg-teal-500 px-4 py-2 rounded-xl rounded-ss-none text-white'>
          {answer}
          {/* <div className='mt-2'>
            <IconButton className="text-white bg-teal-400" label="Save this answer">
              <IoSaveOutline />
            </IconButton>
          </div> */}
        </div>}
        {videoNames && videoNames.length > 0 && 
        <div className='mt-2 text-gray-600 text-sm'>
        <p className='text-teal-500 text-md inline'>Video: </p>
        {
          videoNames.join(", ")
        }
      </div>}
      </div>
    </div>
  )
}

export default QABox;