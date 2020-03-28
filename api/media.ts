import { NowRequest, NowResponse } from "@now/node";
import { getMedia } from '../service/insta'
import mcache from 'memory-cache'

export default async function(req: NowRequest, res: NowResponse) {
    const { url } = req.query
    let key = '__now_server__' + req.url
    let cachedBody = mcache.get(key)
    if (cachedBody) return res.send(cachedBody)
    if(!url) {
        return res.status(400).json({
            success: false,
            message: "url parameter is missing"
        })
    }
    let get_medias = await getMedia(url)
    var medias = []
    if(get_medias) {
        let {owner, edge_media_to_caption} = get_medias.shortcode_media
        let profile = {
            username: owner.username,
            displayName: owner.full_name,
            profile_pic_url: owner.profile_pic_url
        }
        if ("edge_sidecar_to_children" in get_medias.shortcode_media) {
            var shortcode_media_children = get_medias.shortcode_media.edge_sidecar_to_children.edges
            shortcode_media_children.forEach(mediachil => {
                let media_child_node = mediachil.node
                medias.push({
                    "url": media_child_node.is_video ? media_child_node.video_url : media_child_node.display_url,
                    "display_url": media_child_node.display_url,
                    "type": media_child_node.is_video ? "video" : "photo"
                })
            });
        } else {
            var shortcode_media = get_medias.shortcode_media
            medias.push({
                "url": shortcode_media.is_video ? shortcode_media.video_url : shortcode_media.display_url,
                "display_url": shortcode_media.display_url,
                "type": shortcode_media.is_video ? "video" : "photo"
            })
        }
        const response = {
            success: true,
            message: "OK",
            data: {
                profile: owner,
                caption: edge_media_to_caption.edges[0].node.text,
                medias: medias
            }
        }
        mcache.put(key, response, 60 * 1000);
        return res.json(response)
    } else {
        return res.status(500).json({
            success: false,
            message: "Make sure the link is correct or the profile is not private",
            error: "Failed to fetch",
        })
    }
}