import { useEffect, useState } from "react";
import React from "react";
import videoUrls from "../../src/links/id2link.json";

const YouTubeVideo = ({ idImg }) => {
  const [urlVideo, setUrlVideo] = useState("");

  useEffect(() => {
    const url = videoUrls[idImg];
    setUrlVideo(url);
  }, [idImg]);

  return (
    <div>
      <iframe
        width="750"
        height="422"
        src={urlVideo}
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy  ="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default YouTubeVideo;
