import { NowRequest, NowResponse } from "@now/node";
import { getProfile } from '../service/insta'
import mcache from 'memory-cache'


export default async function(req: NowRequest, res: NowResponse) {
    const { username } = req.query

    let key = '__now_server__' + req.url
    let cachedBody = mcache.get(key)
    if (cachedBody) return res.send(cachedBody)

    if(!username) return res.status(400).json({
        success: false,
        message: "username parameter is missing"
    })
    let profile = await getProfile(username)
    if(profile) {
        let response = {
            id: profile.id,
            profile_pict: profile.profile_pic_url_hd,
            full_name: profile.full_name,
            username: profile.username,
            biography: profile.biography,
            followers: profile.edge_followed_by.count,
            following: profile.edge_follow.count,
            external_url: profile.external_url,
            is_business_account: profile.is_business_account,
            is_private: profile.is_private,
            is_verified: profile.is_verified,
        }
        mcache.put(key, response, 60 * 1000);
        res.json(response)
    } else {
        res.status(500).json({
            success: false,
            message: "Make sure the link is correct or the profile is not private",
            error: "Failed to fetch",
        })
    }

}