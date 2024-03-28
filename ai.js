client.on('message', async (message) => {
    let from = message.from;
    let url = message.body.split(' ')[1];
    let isGroups = message.from.endsWith('@g.us') ? true : false;
    const commandPrefix = '!'; // Définir le préfixe des commandes
   // Utilisez upsert pour vérifier et créer/mettre à jour l'utilisateur en une seule étape
   let user = await prisma.user.findUnique({
    where: {
      phoneNumber: from,
    },
  });
  
  // Vérifier si l'utilisateur existe et s'il a des crédits gratuits restants
  if (!user || user.remainingRequests <= 0) {
    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: from,
          subscriptionType: 'free',
          remainingRequests: 100,
        },
      });
    } else {
      // Envoyer un message à l'utilisateur si ses crédits gratuits sont épuisés
      const exhaustedCreditMessage = "Vous avez épuisé votre crédit pour la version gratuite. Veuillez vous abonner à la version payante qui est illimitée. Envoyer #00 pour accéder au menu.";
      await client.sendMessage(from, exhaustedCreditMessage);
      return;
    }
  }
  
  // Décrémenter le nombre de requêtes restantes
  await prisma.user.update({
    where: {
      phoneNumber: from,
    },
    data: {
      remainingRequests: {
        decrement: 1,
      },
    },
  });
  
    // Définition des fonctions detailYouTube et downloadYouTube
    
        async function detailYouTube(url) {
    client.sendMessage(message.from, '[⏳] Veillez patienter, Clever télécharge la vidéo pour vous...');
    try {
        let info = await ytdl.getInfo(url);
        let data = {
            "channel": {
                "name": info.videoDetails.author.name,
                "user": info.videoDetails.author.user,
                "channelUrl": info.videoDetails.author.channel_url,
                "userUrl": info.videoDetails.author.user_url,
                "verified": info.videoDetails.author.verified,
                "subscriber": info.videoDetails.author.subscriber_count
            },
            "video": {
                "title": info.videoDetails.title,
                "description": info.videoDetails.description,
                "lengthSeconds": info.videoDetails.lengthSeconds,
                "videoUrl": info.videoDetails.video_url,
                "publishDate": info.videoDetails.publishDate,
                "viewCount": info.videoDetails.viewCount
            }
        }
        client.sendMessage(message.from, `*CHANNEL DETAILS*\n• Name : *${data.channel.name}*\n• User : *${data.channel.user}*\n• Verified : *${data.channel.verified}*\n• Channel : *${data.channel.channelUrl}*\n• Subscriber : *${data.channel.subscriber}*`);
        client.sendMessage(message.from, `*VIDEO DETAILS*\n• Title : *${data.video.title}*\n• Seconds : *${data.video.lengthSeconds}*\n• VideoURL : *${data.video.videoUrl}*\n• Publish : *${data.video.publishDate}*\n• Viewers : *${data.video.viewCount}*`)
        client.sendMessage(message.from, '*[✅]* Votre vidéo à été téléchargé avec succès!');
    } catch (err) {
        console.log(err);
        client.sendMessage(message.from, '*[❎]* Failed!');
    }
  }
  
  async function downloadYouTube(url, format, filter, from) {
    client.sendMessage(message.from, '[⏳] Veillez patienter, Clever télécharge pour vous...');
    let timeStart = Date.now();
    try {
        let info = await ytdl.getInfo(url);
        let data = {
            "channel": {
                "name": info.videoDetails.author.name,
                "user": info.videoDetails.author.user,
                "channelUrl": info.videoDetails.author.channel_url,
                "userUrl": info.videoDetails.author.user_url,
                "verified": info.videoDetails.author.verified,
                "subscriber": info.videoDetails.author.subscriber_count
            },
            "video": {
                "title": info.videoDetails.title,
                "description": info.videoDetails.description,
                "lengthSeconds": info.videoDetails.lengthSeconds,
                "videoUrl": info.videoDetails.video_url,
                "publishDate": info.videoDetails.publishDate,
                "viewCount": info.videoDetails.viewCount
            }
        }
        ytdl(url, { filter: filter, format: format, quality: 'highest' }).pipe(fs.createWriteStream(`./src/database/download.${format}`)).on('finish', async () => {
          const fileSizeMB = fs.statSync(`./src/database/download.${format}`).size / 1024 / 1024;
      
          if (fileSizeMB > maxFileSizeMB) {
            // Supprimer le fichier si la taille est trop grande
            fs.unlinkSync(`./src/database/download.${format}`);
            client.sendMessage(message.from, `[❌] La taille de la vidéo dépasse la limite de ${maxFileSizeMB} Mo. Veuillez télécharger une vidéo plus courte.`);
            return;
          }
            let timestamp = Date.now() - timeStart;
            media.filename = `${config.filename.mp3}.${format}`;
            await client.sendMessage(message.from, media, { sendMediaAsDocument: true });
            client.sendMessage(message.from, `• Title : *${data.video.title}*\n• Channel : *${data.channel.user}*\n• View Count : *${data.video.viewCount}*\n• TimeStamp : *${timestamp}*`);
            client.sendMessage(message.from, '*[✅]* Votre Vidéo  à été téléchargé avec succès!');
        });
    } catch (err) {
        console.log(err);
        client.sendMessage(message.from, '*[❎]* Failed!');
    }
  }
  if ((isGroups && config.groups) || isGroups) {
    return;
  }
  
  if (!message.body.startsWith(commandPrefix)) {
    return; // Si le message ne commence pas par le préfixe, ne rien faire
  }
  
  const command = message.body.split(' ')[0].slice(commandPrefix.length);
  const args = message.body.split(' ').slice(1);
  
  if (command === 'MP3') {
    downloadYouTube(url, 'mp3', 'audioonly', from); // Passer 'from' à la fonction downloadYouTube
  } else if (command === 'MP4') {
    downloadYouTube(url, 'mp4', 'audioandvideo', from); // Passer 'from' à la fonction downloadYouTube
  } else if (command === 'detail') {
    detailYouTube(url);
  } else if (command === 'aide') {
    client.sendMessage(message.from, `*${config.name}*\n\n[🎥] : *${commandPrefix}MP4 <youtube-url>*\n[🎧] : *${commandPrefix}MP3 <youtube-url>*\n\n*Exemple :*\n${commandPrefix}audio https://youtu.be/abcdefghij`);
  } 
  });
  
  