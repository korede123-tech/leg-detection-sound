let video, canvas, ctx, detector;
let currentSound = null;

function countLegs(keypoints) {
  return keypoints.filter(kp =>
    (kp.name === 'left_ankle' || kp.name === 'right_ankle') && kp.score > 0.5
  ).length;
}

async function setupCamera() {
  video = document.getElementById('webcam');
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => resolve(video);
  });
}

async function init() {
  await tf.setBackend('webgl');
  await setupCamera();
  await video.play();

  canvas = document.getElementById('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx = canvas.getContext('2d');

  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);

  detectPose();
}

async function detectPose() {
  const poses = await detector.estimatePoses(video);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Mirror the video
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-canvas.width, 0);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  let totalLegs = 0;

  if (poses.length > 0) {
    for (const pose of poses) {
      const keypoints = pose.keypoints;

      // Draw keypoints (mirrored)
      keypoints.forEach(point => {
        if (point.score > 0.5) {
          ctx.beginPath();
          ctx.arc(canvas.width - point.x, point.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'lime';
          ctx.fill();
        }
      });

      totalLegs += countLegs(keypoints);
    }
  }

  // Get sound elements
  const soundA = document.getElementById('sound');   // 2 legs
  const soundB = document.getElementById('sound1');  // 4 legs
  const soundC = document.getElementById('sound2');  // 6 legs

  // Stop all sounds helper
  function stopAll() {
    [soundA, soundB, soundC].forEach(s => {
      s.pause();
      s.currentTime = 0;
    });
    currentSound = null;
  }

  // Play specific sound
  if (totalLegs >= 6) {
    if (currentSound !== 'sound2') {
      stopAll();
      soundC.play();
      currentSound = 'sound2';
      console.log('🐛 6 legs detected - playing sound2.mp3');
    }
  } else if (totalLegs >= 4) {
    if (currentSound !== 'sound1') {
      stopAll();
      soundB.play();
      currentSound = 'sound1';
      console.log('👣 4 legs detected - playing sound1.mp3');
    }
  } else if (totalLegs >= 2) {
    if (currentSound !== 'sound') {
      stopAll();
      soundA.play();
      currentSound = 'sound';
      console.log('🦵 2 legs detected - playing sound.mp3');
    }
  } else {
    if (currentSound) {
      stopAll();
      console.log('❌ Less than 2 legs - stopping all sounds');
    }
  }

  requestAnimationFrame(detectPose);
}

window.onload = init;
