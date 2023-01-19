import React from 'react'
import style from "./loader.module.scss";

type Props = {}

export default function Loader(props: Props) {
    return (
        <div className={style.container}>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
            <div className={style.circle}></div>
        </div>
    )
}