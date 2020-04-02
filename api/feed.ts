import { NowRequest, NowResponse } from "@now/node";
import { getMedia, getProfile } from '../service/insta'
import mcache from 'memory-cache'

export default async function(req: NowRequest, res: NowResponse) {
    const { username } = req.query

    let key = '__now_server__' + req.url
    let cachedBody = mcache.get(key)
    if (cachedBody) return res.send(cachedBody)

    const profile = await getProfile(username)
    let medias = []
    let feeds = []
    let caption
    if(!username) return res.status(400).json({
        success: false,
        message: "username parameter is missing"
    })
    if(!profile) {
        return res.status(500).json({
            success: false,
            message: "Make sure the link is correct or the profile is not private",
            error: "Failed to fetch",
        })
    }
    let edges = profile.edge_owner_to_timeline_media.edges || null
    for (let i = 0; i < edges.length; i++) {
        const element = edges[i];        
        const shortcode = element.node.shortcode
        try {
            caption = element.node.edge_media_to_caption.edges[0].node['text']
        } catch (error) {
            caption = ""
        }
        let get_medias = await getMedia(shortcode)
        let shortcode_media = get_medias.shortcode_media
        if ("edge_sidecar_to_children" in shortcode_media) {
            let shortcode_media_children = shortcode_media.edge_sidecar_to_children.edges
            shortcode_media_children.forEach(mediachild => {
                let media_child_node = mediachild.node
                medias.push({
                    "url": media_child_node.is_video ? media_child_node.video_url : media_child_node.display_url,
                    "display_url": media_child_node.is_video ? media_child_node.display_url : media_child_node.display,
                    "type": media_child_node.is_video ? "video" : "photo"
                })
            })
        } else {
            medias.push({
                "url": shortcode_media.is_video ? shortcode_media.video_url : shortcode_media.display_url,
                "display_url": shortcode_media.is_video ? shortcode_media.display_url : shortcode_media.display,
                "type": shortcode_media.is_video ? "video" : "photo"
            })
        }
        feeds.push({
            'shortcode': shortcode,
            'link': `https://www.instagram.com/p/${shortcode}/`,
            'caption': caption,
            'total_like': shortcode_media.edge_media_preview_like.count,
            'total_comment': shortcode_media.edge_media_preview_comment.count,
            'nodes': medias
        })
    }
    let response = {
        nodes: feeds
    }
    mcache.put(key, response, 60 * 1000);
    res.send(response)

}