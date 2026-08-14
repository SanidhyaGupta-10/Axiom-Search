import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import axios from "axios"
import { BACKEND_URL } from "@/config"

const supabase = createClient()

export default function Dashboard() {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)
    
    useEffect(()=>{
        async function getInfo(){
            const {data : {user}, error} = await supabase.auth.getUser()
            if (error) {
                console.error("Error fetching user:", error.message)
            } else {
                setUser(user)
            }
        }
        getInfo();
    },[]);

    useEffect(() => {
        async function getConversations(){
            if (user) {
                const { data: { session } } = await supabase.auth.getSession();
                const jwt = session?.access_token;

                axios.post(`${BACKEND_URL}`)
            }
        }
        getConversations();
    }, [])

    return (
        <div>
        {!user?.email && <button 
        onClick={() => navigate('/auth')}>
        SignIn</button>}

         {user && <div>
            {user?.email}
            <button onClick={() => {
                supabase.auth.signOut();
                setUser(null)
            }}>Logout</button>
            </div>}
        </div>
    )
}   