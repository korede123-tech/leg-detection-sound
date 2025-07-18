let video, canvas, ctx, detector, sound;
let playing = false;

async function setupCamera() {
  video = document.getElementById('webcam');
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => resolve(video);
  });
}

function legsVisible(keypoints) {
  const left = keypoints.find(kp => kp.name === 'left_ankle' && kp.score > 0.5);
  const right = keypoints.find(kp => kp.name === 'right_ankle' && kp.score > 0.5);
  return left && right;
}

async function init() {
  await tf.setBackend('webgl');
  await setupCamera();
  await video.play();

  canvas = document.getElementById('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx = canvas.getContext('2d');

  sound = document.getElementById('sound');

  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);

  detectPose();
}

async function detectPose() {
  const poses = await detector.estimatePoses(video);

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Mirror the canvas before drawing video
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-canvas.width, 0);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (poses.length > 0) {
    const keypoints = poses[0].keypoints;

    // Draw keypoints (non-mirrored, so they align with mirrored video)
    keypoints.forEach(point => {
      if (point.score > 0.5) {
        ctx.beginPath();
        ctx.arc(canvas.width - point.x, point.y, 5, 0, 2 * Math.PI); // mirror x
        ctx.fillStyle = 'lime';
        ctx.fill();
      }
    });

    if (legsVisible(keypoints)) {
      if (!playing) {
        sound.play();
        playing = true;
        console.log('🦵 Legs detected - playing sound');
      }
    } else {
      sound.pause();
      sound.currentTime = 0;
      playing = false;
    }
  }

  requestAnimationFrame(detectPose);
}

window.onload = init;
