import React from 'react';
import { useAuth } from './AuthContext';

const Header = () => {
    const { isLoggedIn, user, logout } = useAuth();

    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc' }}>
            <h1>Flex Leather</h1>
            <nav>
                {isLoggedIn && user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {user.profileImage ? (
                            <img
                                src={user.profileImage}
                                alt="User Avatar"
                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#e0e0e0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#333',
                                fontWeight: 'bold',
                                fontSize: '18px'
                            }}>
                                {user.userName?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span>{user.userName}</span>
                        <button onClick={logout} style={{ marginLeft: '1rem' }}>Logout</button>
                    </div>
                ) : (
                    <a href="/login">Login / Register</a>
                )}
            </nav>
        </header>
    );
};

export default Header;

