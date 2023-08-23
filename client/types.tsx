export type ResultType<P extends (...args: any) => any> = ReturnType<P> extends Promise<infer T> ? T : never;
export type CommerbleCartLine = {
    productId: number
    externalId1: string
    externalId2: string
    externalId3: string
    externalId4: string
    productName: string
    unitPriceWithTax: number
    unitPriceWithoutTax: number
    discountPrice: number
    requestAmount: number
    orderAmount: number
    linePrice: number
    tax: number
    description: string|null
    reserveRequestId: number
}
export type CommerbleCartDef = {
    id: number
}
export type CommerbleCartItems = CommerbleCartDef & {
    items: CommerbleCartLine[]
}
export type CommerbleViewState = {
    messages: string[]
    warnings: string[]
    errors: string[]
}
export type CommerbleCart = CommerbleCartItems & {
    errors: string[]
    state: CommerbleViewState
}
export type CommerbleOrderCart = {
    type: 'order/cart'
    carts: CommerbleCart[]
}
export type CommerbleZipAddress = {
    ZipCode: string
    JisCode: string
    Prefecture: string
    PrefectureId: number
    City: string
    Street: string
}
export type CommerbleAddress = {
    addressId?: number
    addressName?: string
    recipientlastname?: string
    recipientlastnamekana?: string
    recipientfirstname?: string
    recipientfirstnamekana?: string
    countryCode?: string
    zipCode?: string
    pref?: string
    city?: string
    street?: string
    building?: string
    tel?: string
}
export type CommerblePurchaseShipping = {
    type: 'purchase/shipping'
    state: CommerbleViewState
    items: CommerbleCartLine[]
    customer?: {
        lastName?: string
        lastNameKana?: string
        firstName?: string
        firstNameKana?: string
        emailAddr?: string
    }
    orderCustomerOrderedAddress?: CommerbleAddress
    deliveryOrderAddress?: CommerbleAddress
    deliveryMethod?: number
    serviceValues?: { [key:string]: string }
    hasDestinationAddress: boolean
}
export type CommerblePaymentMethod = 'CashOnDelivery' | 'Token' | 'PointOnly' | 'Cvs' | 'Offsite' | 'Offline' | 'External' | 'None'
export type CommerblePurchasePayment = {
    type: 'purchase/payment'
    state: CommerbleViewState
    items: CommerbleCartLine[]
    inputUsagePoint?: number
    deliveryOrder?: {
        deliveryDate?: string
        hourRange?: string
        wrappingType?: number
        senderName?: string
    }
    paymentMethod?: CommerblePaymentMethod
    orderCustomer: {
        paymentDetail?: string
        numberOfPayments?: string
    }
    localStoreCardDisplayNo?: number
    isEasyCardEntry?: boolean
    serviceValues?: { [key:string]: string }
}
export type CommerblePurchaseConfirm = CommerbleCart & {
    type: 'purchase/confirm'
    state: CommerbleViewState
    items: CommerbleCartLine[]
    chargePointSummary: number
    deliveryCharge: number
    deliveryOrder?: {
        deliveryDate?: string
        hourRange?: string
        wrappingType?: number
        senderName?: string
    }
    deliveryOrderAddress?: CommerbleAddress
    discountPrice: 0
    orderCustomer: {
        lastName?: string
        lastNameKana?: string
        firstName?: string
        firstNameKana?: string
        emailAddr?: string
        paymentDetail?: string
        numberOfPayments?: string
    }
    orderCustomerOrderedAddress?: CommerbleAddress
    orderCustomerInvoiceAddress?: CommerbleAddress
    paymentMethod?: CommerblePaymentMethod
    serviceValues?: { [key:string]: string }
    subtotal: number
    token: string
    totalPayment: number
    totalUsagePoint: number
}
export type CommerbleOrderStatus = 'Accept' | 'UnAllocate' | 'PartAllocate' | 'Allocated' | 'ShipIndicate' | 'Ship' | 'Arrival' | 'Booked' | 'Cancel' | 'ShipSuspend' | 'WorkerProcessing'
export type CommerblePaymentStatus = 'Ready' | 'Success' | 'Fail' | 'Processing' | 'Cancel'
export type CommerbleMemberStatus = 'Default' | 'Attention' | 'Warning'
export type CommerbleOrderInfo = CommerbleCart & {
    orderId: number
    orderDate: string
    orderStatus: CommerbleOrderStatus
    paymentStatus: CommerblePaymentStatus
    chargePointSummary: number
    deliveryCharge: number
    deliveryOrder?: {
        deliveryDate?: string
        hourRange?: string
        wrappingType?: number
        senderName?: string
        deliveryNo?: string
    }
    deliveryOrderAddress?: CommerbleAddress
    discountPrice: 0
    orderCustomer: {
        lastName?: string
        lastNameKana?: string
        firstName?: string
        firstNameKana?: string
        emailAddr?: string
        paymentDetail?: string
        numberOfPayments?: string
        isGuest: boolean
        memberRank?: number
        memberStatus?: CommerbleMemberStatus
        paymentSlipNumber?: string
        paymentSlipUrl?: string
        autoCancelDate?: string
    }
    orderCustomerOrderedAddress?: CommerbleAddress
    orderCustomerInvoiceAddress?: CommerbleAddress
    paymentMethod?: CommerblePaymentMethod
    serviceValues?: { [key:string]: string }
    subtotal: number
    totalPayment: number
    totalUsagePoint: number
}
export type CommerblePurchaseExternal = {
    type: 'purchase/external'
    state: CommerbleViewState
    items: CommerbleCartLine[]
} & CommerbleOrderInfo
export type CommerblePurchaseComplete = {
    type: 'purchase/complete'
    state: CommerbleViewState
    items: CommerbleCartLine[]
} & CommerbleOrderInfo
export type CommerblePurchaseError = {
    type: 'purchase/error'
} & Omit<CommerblePurchaseConfirm, 'type'>
export type CommerblePurchaseCallback = {
    type: 'purchase/callback'
    state: CommerbleViewState
    items: CommerbleCartLine[]
} & CommerbleCart
export type CommerbleSiteLogin = {
    type: 'site/login'
    userName: string
    password: string
    returnUrl: string
    token: string
    state: CommerbleViewState
}
export type CommerbleSiteLoginState = {
    type: 'site/loginstate'
    userName: string
    password: string
    returnUrl: string
    token: string
    state: CommerbleViewState
}
export type CommerbleSiteAccount = {
    type: 'site/account'
    password: string
    confirmPassword: string
    token: string
    state: CommerbleViewState
} & Partial<Omit<CommerbleAccount, 'userNo'>>
export type CommerbleSiteAccountConfirm = {
    type: 'site/accountconfirm'
    token: string
    model: string
    state: CommerbleViewState
} & Omit<CommerbleAccount, 'userNo'>
export type CommerbleSiteAccountComplete = {
    type: 'site/accountcomplete'
    state: CommerbleViewState
}
export type CommerbleSiteActivate = {
    type: 'site/activate'
    state: CommerbleViewState
}
export type CommerbleSiteActivateRequest = {
    type: 'site/activaterequest'
    state: CommerbleViewState
    token: string
}
export type CommerbleSiteGuestOrder = {
    type: 'site/guestorder'
    state: CommerbleViewState
    token: string
}
export type CommerbleSiteRecoveryComplete = {
    type: 'site/recoverycomplete'
    state: CommerbleViewState
}
export type CommerbleSiteRecovery = {
    type: 'site/recovery'
    state: CommerbleViewState
    token: string
}
export type CommerbleSiteRecoveryUpdate = {
    type: 'site/recoveryupdate'
    state: CommerbleViewState
    token: string
}
export type CommerbleMemberIndex = {
    type: 'member/index'
    state: CommerbleViewState
}
export type CommerbleMemberQuit = {
    type: 'member/quit'
    state: CommerbleViewState
}
export type CommerbleMemberPoint = {
    type: 'member/point'
    state: CommerbleViewState
    activePoint: number,
    temporaryPoint: number,
    expireDate: string
}
export type CommerbleMemberAccountAddressConfirm = {
    type: 'member/accountaddressconfirm'
    state: CommerbleViewState
    model: string
    token: string
} & Omit<CommerbleAddress, 'addressId'|'recipientlastname'|'recipientfirstname'|'recipientlastnamekana'|'recipientfirstnamekana'>
export type HumanSex = 'NotKnown' | 'Male' | 'Female' | 'NotApplicable'
export type CommerbleAccount = {
    userNo: string
    userName: string
    lastName: string
    firstName: string
    lastNameKana: string
    firstNameKana: string
    sex: null|HumanSex
    birthday: string
    birthdayY: number
    birthdayM: number
    birthdayD: number
    subscribe: null|boolean
}
export type CommerbleMemberAccountConfirm = {
    type: 'member/accountconfirm'
    state: CommerbleViewState
    model: string
    token: string
} & Omit<CommerbleAccount, 'userNo'|'userName'>
export type CommerbleMemberAccount = {
    type: 'member/account'
    state: CommerbleViewState
    address: & Omit<CommerbleAddress, 'addressId'|'recipientlastname'|'recipientfirstname'|'recipientlastnamekana'|'recipientfirstnamekana'>
} & Omit<CommerbleAccount, 'userNo'|'userName'>
export type CommerbleMemberAddress = {
    type: 'member/address'
    state: CommerbleViewState
} & CommerbleAddress
type Paging = {
    current: number
    total: number
    size: number
    maxPage: number
}
export type CommerbleMemberAddressList = {
    type: 'member/addresslist'
    state: CommerbleViewState
    paging: Paging
    items: CommerbleAddress[]
}
type Product = {
    id: number
    externalId1: string
    externalId2: string
    externalId3: string
    externalId4: string
    name: string
    releaseDate: string
    unitPriceWithoutTax: number
    unitPriceWithTax: number
}
export type CommerbleMemberFavoriteAppend = {
    type: 'member/favoriteappend'
    state: CommerbleViewState
    product: Product
    token: string
}
export type CommerbleFavorite = {
    product: Product
    registerAt: string
}
export type CommerbleMemberFavorite = {
    type: 'member/favorite'
    state: CommerbleViewState
    token: string
} & CommerbleFavorite
export type CommerbleMemberFavoriteList = {
    type: 'member/favoritelist'
    state: CommerbleViewState
    paging: Paging
    items: CommerbleFavorite[]
}
export type CommerbleMemberNoticeAppend = {
    type: 'member/noticeappend'
    state: CommerbleViewState
    product: Product
    token: string
}
export type CommerbleReserve = {
    product: Product
    id: number
    orderId: number|null
    requestAt: string
    status: 'Accept' | 'Allocated' | 'Purchased' | 'Cancel'
    amount: number
    expireAt: string
    canCancel: boolean
}
export type CommerbleMemberNotice = {
    type: 'member/notice'
    state: CommerbleViewState
    token: string
} & CommerbleReserve
export type CommerbleMemberNoticeList = {
    type: 'member/noticelist'
    state: CommerbleViewState
    paging: Paging
    items: CommerbleReserve[]
}
export type CommerbleMemberPassword = {
    type: 'member/password'
    state: CommerbleViewState
}
export type CommerbleMemberPayments = {
    type: 'member/payments'
    state: CommerbleViewState
    payments: any[]
}
export type CommerbleMemberUserNameConfirm = {
    type: 'member/usernameconfirm'
    state: CommerbleViewState
    userName: string
    model: string
    token: string
}
export type CommerbleOrderHistory= {
    type: 'order/history'
    state: CommerbleViewState
    canCancel: boolean
    canModify: boolean
    canModifyPaymentMethod: boolean
    hasChanges: boolean
    token: string
} & CommerbleOrderInfo
export type CommerbleOrderHistoryCancel= {
    type: 'order/historycancel'
    state: CommerbleViewState
    canCancel: boolean
    canModify: boolean
    canModifyPaymentMethod: boolean
    hasChanges: boolean
    token: string
} & CommerbleOrderInfo
export type CommerbleOrderHistoryCustomer= {
    type: 'order/historycustomer'
    state: CommerbleViewState
    canCancel: boolean
    canModify: boolean
    canModifyPaymentMethod: boolean
    hasChanges: boolean
    token: string
} & CommerbleOrderInfo
export type CommerbleOrderHistoryCustomerForm = Pick<CommerbleOrderHistoryCustomer, 'id'|'serviceValues'> & { 
    orderCustomer: Pick<CommerbleOrderHistoryCustomer['orderCustomer'], 'emailAddr'> 
}
export type CommerbleOrderHistoryDelivery= {
    type: 'order/historydelivery'
    state: CommerbleViewState
    canCancel: boolean
    canModify: boolean
    canModifyPaymentMethod: boolean
    hasChanges: boolean
    token: string
} & CommerbleOrderInfo
export type CommerbleOrderHistoryDeliveryForm = Pick<CommerbleOrderHistoryDelivery, 'id'> & {
    deliveryOrder: Pick<CommerbleOrderHistoryDelivery['deliveryOrder'], 'deliveryDate'|'hourRange'|'wrappingType'|'senderName'>
}
export type CommerbleOrderHistoryPayment= {
    type: 'order/historypayment'
    state: CommerbleViewState
    canCancel: boolean
    canModify: boolean
    canModifyPaymentMethod: boolean
    hasChanges: boolean
    token: string
} & CommerbleOrderInfo
export type CommerbleOrderHistoryPaymentForm = Pick<CommerbleOrderHistoryPayment, 'id'|'serviceValues'|'paymentMethod'> & { 
    orderCustomer: Pick<CommerbleOrderHistoryPayment['orderCustomer'], 'paymentDetail'|'numberOfPayments'> 
}
export type CommerbleOrderHistoryShipping= {
    type: 'order/historyshipping'
    state: CommerbleViewState
    canCancel: boolean
    canModify: boolean
    canModifyPaymentMethod: boolean
    hasChanges: boolean
    token: string
} & CommerbleOrderInfo
export type CommerbleOrderHistoryShippingForm = Pick<CommerbleOrderHistoryShipping, 'id'|'serviceValues'> & {
    deliveryOrderAddress: Omit<CommerbleOrderHistoryShipping['deliveryOrderAddress'], 'addressId'|'addressName'>
}
export type CommerbleOrderHistoryList= {
    type: 'order/historylist'
    state: CommerbleViewState
    paging: Paging
    items: {
        id: number
        orderDate: string
        orderStatus: CommerbleOrderStatus
        paymentMethod: CommerblePaymentMethod
        paymentStatus: CommerblePaymentStatus
        totalPayment: number
        paymentDetail: string
        autoCancelDate: string
        shipSourceId: string
        deliveryNo: string        
    }[]
}
export type CommerbleOrderArchive= {
    type: 'order/archive'
    state: CommerbleViewState
} & CommerbleOrderInfo
export type CommerbleOrderArchiveList= {
    type: 'order/archivelist'
    state: CommerbleViewState
    paging: Paging
    items: {
        id: number
        orderDate: string
        orderStatus: CommerbleOrderStatus
        paymentMethod: CommerblePaymentMethod
        paymentStatus: CommerblePaymentStatus
        totalPayment: number
        paymentDetail: string
        autoCancelDate: string
        shipSourceId: string
        deliveryNo: string        
    }[]
}

export type CommerbleErrorBadRequest = {
    type: 'error/badrequest'
}
export type CommerbleErrorUnauthorized = {
    type: 'error/unauthorized'
}
export type CommerbleErrorForbidden = {
    type: 'error/forbidden'
}
export type CommerbleErrorNotFound = {
    type: 'error/notfound'
}
export type CommerbleErrorConflict = {
    type: 'error/conflict'
}
export type CommerbleErrorInternalServerError = {
    type: 'error/internalservererror'
}
export type CommerbleErrorServiceUnavailable = {
    type: 'error/serviceunavailable'
}
export type CommerbleErrorState = CommerbleErrorBadRequest
                                | CommerbleErrorUnauthorized
                                | CommerbleErrorForbidden
                                | CommerbleErrorNotFound
                                | CommerbleErrorConflict
                                | CommerbleErrorInternalServerError
                                | CommerbleErrorServiceUnavailable

type CommerbleStateVM = CommerbleOrderCart 
                        | CommerbleOrderHistory
                        | CommerbleOrderHistoryList
                        | CommerbleOrderArchive
                        | CommerbleOrderArchiveList
                        | CommerblePurchaseShipping
                        | CommerblePurchasePayment
                        | CommerblePurchaseConfirm
                        | CommerblePurchaseExternal
                        | CommerblePurchaseComplete
                        | CommerblePurchaseCallback
                        | CommerblePurchaseError
                        | CommerbleSiteLogin
                        | CommerbleSiteAccount
                        | CommerbleSiteAccountConfirm
                        | CommerbleSiteAccountComplete
                        | CommerbleSiteActivate
                        | CommerbleSiteActivateRequest
                        | CommerbleSiteRecovery
                        | CommerbleSiteRecoveryComplete
                        | CommerbleSiteRecoveryUpdate
                        | CommerbleMemberIndex
                        | CommerbleMemberQuit
                        | CommerbleMemberPoint
                        | CommerbleMemberAccountAddressConfirm
                        | CommerbleMemberAccountConfirm
                        | CommerbleMemberAccount
                        | CommerbleMemberAddress
                        | CommerbleMemberAddressList
                        | CommerbleMemberFavoriteAppend
                        | CommerbleMemberFavorite
                        | CommerbleMemberFavoriteList
                        | CommerbleMemberNoticeAppend
                        | CommerbleMemberNotice
                        | CommerbleMemberNoticeList
                        | CommerbleMemberPassword
                        | CommerbleMemberUserNameConfirm
                        | CommerbleErrorState
export type CommerbleNextType = CommerbleStateVM['type']|'self'|'loginstate'
export type CommerbleResult<TNext extends CommerbleNextType> = {
    type: 'next',
    next: TNext,
    raw: string,
}
export type CommerbleState<TNext extends CommerbleNextType> = CommerbleResult<TNext> | CommerbleStateVM
export type CommerbleCartInRequest = {
    item: number, 
    qty:number, 
    desc?:string,
    reserve?:number
}[]