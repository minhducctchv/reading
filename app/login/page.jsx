'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        })

        const data = await res.json()
        setLoading(false)

        if (data.success) {
            router.replace('/')
        } else {
            setError(data.message || 'Sai mật khẩu!')
            setPassword('')
        }
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                <div style={styles.lockIcon}>🔒</div>
                <h1 style={styles.title}>Trang cá nhân</h1>
                <p style={styles.subtitle}>Nhập mật khẩu để tiếp tục</p>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mật khẩu..."
                        autoFocus
                        required
                        style={styles.input}
                    />
                    {error && <p style={styles.error}>{error}</p>}
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Đang kiểm tra...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
                * { box-sizing: border-box; }
                body { margin: 0; font-family: 'Inter', sans-serif; }
                input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
                button:hover:not(:disabled) { background: #4f46e5 !important; transform: translateY(-1px); box-shadow: 0 4px 15px rgba(99,102,241,0.4); }
                button:active:not(:disabled) { transform: translateY(0); }
                button:disabled { opacity: 0.7; cursor: not-allowed; }
            `}</style>
        </div>
    )
}

const styles = {
    overlay: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        padding: '20px',
    },
    card: {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    },
    lockIcon: {
        fontSize: '48px',
        marginBottom: '16px',
        display: 'block',
    },
    title: {
        color: '#ffffff',
        fontSize: '24px',
        fontWeight: '600',
        margin: '0 0 8px 0',
        fontFamily: 'Inter, sans-serif',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '14px',
        margin: '0 0 32px 0',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    input: {
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '10px',
        padding: '14px 18px',
        color: '#ffffff',
        fontSize: '16px',
        transition: 'all 0.2s',
    },
    error: {
        color: '#ff6b6b',
        fontSize: '14px',
        margin: '0',
        background: 'rgba(255,107,107,0.1)',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(255,107,107,0.2)',
    },
    button: {
        background: '#6366f1',
        color: '#ffffff',
        border: 'none',
        borderRadius: '10px',
        padding: '14px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: 'Inter, sans-serif',
    },
}
