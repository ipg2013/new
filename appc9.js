var app=angular.module('myApp', ['ui.router', 'ngToast', 'textAngular']);

app.config(function($stateProvider, $urlRouterProvider, $locationProvider){
    Stamplay.init("riddhi");
    localStorage.removeItem("https://blogit-ipg2013.c9users.io-jwt");
    $locationProvider.hashPrefix('');
    
    $stateProvider
    .state('home', {
        url: '/',
        templateUrl: "templates/home.html",
        controller: "HomeCtrl"
    })
    .state('login', {
        url: '/login',
        templateUrl: "templates/login.html",
        controller: "LoginCtrl"
    })
    .state('create', {
        url: '/create',
        templateUrl: "templates/create.html",
        controller: "CreateCtrl",
        authenticate: true
    })
    .state('myBlogs', {
        url: '/myBlogs',
        templateUrl: "templates/myBlogs.html",
        controller: "MyBlogsCtrl",
        authenticate: true
    })
    .state('Edit', {
        url: '/edit/:id',
        templateUrl: "templates/edit.html",
        controller: "EditCtrl",
        authenticate: true// we could use any name instead of 'authenticate'
    })
    .state('View', {
        url: '/view/:id',
        templateUrl: "templates/view.html",
        controller: "ViewCtrl",
        authenticate: false // false likho ya ye line skip kardo ek bat h
    })
    .state('signup', {
        url: '/signup',
        templateUrl: "templates/signup.html",
        controller: "SignupCtrl"
    });
    
    $urlRouterProvider.otherwise("/");//valid route ke alawa kuch bhi likho to home pr direct kr denge
});
//.state takes two parameters, first is name of state i.e 'home' other are specifics in JSON object
//a url is visitable iff a state has been created ass with it.



app.run(function($rootScope, AuthService, $state){
    /*Stamplay.User.currentUser()
    .then(
      function(res){
          if(res.user){
              $rootScope.loggedIn=true;
              console.log($rootScope.loggedIn);
          }
          else{
              $rootScope.loggedIn=false;
              console.log($rootScope.loggedIn);
          }
      } ,
      function(err){
          console.log("an error occured while getting the current user");
      }
    );*/
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
        console.log(fromState);
        console.log(toState);
        if(toState.authenticate==true){
            console.log("authenticate==true");
            AuthService.isAuthenticated()
            .then(
                function(res){
                    console.log(res);
                    if(res==false){
                        $state.go("login");
                    }
                }
            );
        }else{
            console.log("authenticate==false");
        }
        
    });
});



app.factory('AuthService', function($q, $rootScope){
    return {
        isAuthenticated: function(){
            var defer=$q.defer();
            Stamplay.User.currentUser(function(err, res){
               if(err){
                   $rootScope.loggedIn=false;
                   defer.resolve(false);
               } 
               if(res.user){
                   $rootScope.loggedIn=true;
                   defer.resolve(true);
               }
               else{
                   $rootScope.loggedIn=false;
                   defer.resolve(false);
               }
            });
            return defer.promise;
        }
    }
});



app.filter('htmlToPlainText', function(){
   return function(text){
       return text ? String(text).replace(/<[^>]+>/gm, ''):'';
   } 
});



app.controller('HomeCtrl', function($scope){
    Stamplay.Object("blogs").get({sort: "-dt_create"})//get ka parameter is a JSON object, sort me reverse chronological order, latest first
    .then(
        function(response){
            $scope.latestBlogs=response.data;
            $scope.$apply();//to update the view
            console.log(response);
        },
        function(err){
            console.log(err);
        }
    );
});
app.controller('ViewCtrl', function($scope, $timeout, $state, ngToast, $stateParams){
    $scope.upVoteCount=0;
    $scope.downVoteCount=0;
    Stamplay.Object("blogs").get({_id: $stateParams.id})
    .then(
        function(response){
            $scope.blog=response.data[0];
            $scope.upVoteCount=$scope.blog.actions.votes.users_upvote.length;
            console.log("in view");
            $scope.$apply();//to update the view
            console.log(response);
        },
        function(err){
            console.log(err);
        }
    );
    
    $scope.postComment=function(){
        Stamplay.Object("blogs").comment($stateParams.id,$scope.comment)
        .then(
            function(res){
                console.log("posting comment!")
                $scope.blog=res;//res has updated blog data with comments
                console.log(res);
                $scope.comment="";// input box afetr posting is to be blank
                $scope.$apply();
                
            },
            function(err){
                console.log(err);
                if(err.code==403){
                    console.log("login first");
                    $timeout(function(){ngToast.create("<a class='' href='#/login'>Please login before Posting comments");});
                }
            }
        );
    }
    
    $scope.upVote=function(){
        Stamplay.Object("blogs").upVote($stateParams.id)
        .then(
            function(res){
                console.log(res);
                $scope.blog=res;
                $scope.comment="";
                $scope.upVoteCount=$scope.blog.actions.votes.users_upvote.length;
                $scope.$apply();
            },
            function(err){
                console.log(err);
                if(err.code==403){
                    $timeout(function(){ngToast.create("<a class='' href='#/login'>Please login before voting");});
                }
                if(err.code==406){
                    $timeout(function(){ngToast.create("Already voted!");});
                }
            }
        );
    }
});


app.controller('EditCtrl', function(taOptions, $scope, $timeout, $state, ngToast, $stateParams){
    $scope.Post={};
    
    taOptions.toolbar = [
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
      ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
      ['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
      ['html', 'insertImage','insertLink', 'insertVideo', 'wordcount', 'charcount']
      //insab me se jo bhi nai chahiye us stirng element ko hata do then vo icon chala jaega
  ];
  
  Stamplay.Object("blogs").get({_id: $stateParams.id})//by get method we get all posts, here we get posts which have id==id from url
  .then(
    function(res){
        console.log(res);
        $scope.Post=res.data[0];//since url id matched only 1 post, so array size==1 and index of post=0
        $scope.$apply();
        console.log($scope.Post);
        
    },
    function(err){
        console.log(err);
    }
    );
    
    $scope.update=function(){
        Stamplay.User.currentUser()
        .then(
            function(res){
                if(res.user){
                    if(res.user._id==$scope.Post.owner){
                        console.log("ok, u have permission to edit");
                        //loggedIn user's id == post's owner id
                        Stamplay.Object("blogs").update($scope.Post._id, $scope.Post)// if editing problem, replace 'scope.post.id' by '$stateParams.id'
                        .then(
                            function(response){
                                console.log(response);
                                console.log("Updated!! going to myBlogs");
                                $state.go("myBlogs");
                            }  ,
                            function(err){
                               console.log(err); 
                            }
                        );
                    }
                }
                else{
                    $state.go("login");
                }
            },
            function(err){
                console.log(err);
            }
        );
    }
});


app.controller('CreateCtrl', function(taOptions, $scope, $timeout, $state, ngToast){
    
    $scope.newPost={};
    
    taOptions.toolbar = [
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
      ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
      ['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
      ['html', 'insertImage','insertLink', 'insertVideo', 'wordcount', 'charcount']
      //insab me se jo bhi nai chahiye us stirng element ko hata do then vo icon chala jaega
  ];
  
  $scope.create=function(){
      Stamplay.User.currentUser()
      .then(
        function(res){
            if(res.user){
                //proceed with creation of post
                console.log("proceeding with creation of post");
                Stamplay.Object("blogs").save($scope.newPost)//object id likhni h not the name of object
                .then(
                    function(res){
                        $timeout(function(){ngToast.create("Post created successfully");});
                        $state.go("myBlogs");
                    },
                    function(err){
                        $timeout(function(){ngToast.create("An error has occured while creating the post plz try again later");});
                        console.log(err);
                    }
                    
                    );
                
            }
            else{
                //if not logged in
                $state.go("login");
            }
        },
        function(err){
            $timeout(function(){ngToast.create("An error has occured, please try again later");});
            console.log(err);
        }
       );
  }
  
});

app.controller('MainCtrl', function($scope, $rootScope, $timeout){
    $scope.logout=function(){
        console.log("logout called");
        Stamplay.User.logout(true, function(){
           console.log("logged out"); 
           $timeout(function(){$rootScope.loggedIn=false;}, 1000);
        });
    }
});


app.controller('MyBlogsCtrl', function($scope, $state){
    Stamplay.User.currentUser()
    .then(
        function(res){
            if(res.user){
                Stamplay.Object("blogs").get({owner:res.user._id, sort: "-dt_create"})//get ke parameter is a JSON object, sort me reverse chronological order, latest first
                .then(
                    function(response){
                        $scope.userBlogs=response.data;
                        $scope.$apply();//to update the view
                        console.log($scope.userBlogs);
                    },
                    function(err){
                        console.log(err);
                    }
                    );
            }
            else{
                $state.go("login");
            }
        },
        function(err){
            console.log(err);
        }
        );
});



app.controller('LoginCtrl', function($scope, $state, $timeout, $rootScope, ngToast){
    $scope.login=function(){
        console.log("login function chal rha h");
        Stamplay.User.currentUser()
        .then(
            function(res){
                console.log(res);
                if(res.user){
                    $rootScope.loggedIn=true;
                    $rootScope.fullName=res.user.firstName+" "+res.user.lastName;
                    console.log(res.user.firstName+" "+res.user.lastNam);
                    //user already logged in
                    console.log("user already logged in go to'view-Blogs'");
                    $timeout(function(){$state.go("myBlogs");}, 1000);
                }
                else{
                    
                    //proceed with login
                    console.log("proceeding with login");
                   // $timeout(function(){ngToast.create("Login successful! yay");});
                    Stamplay.User.login($scope.newUser)
                    .then(
                        function(res){
                            $rootScope.fullName=res.firstName+" "+res.lastName;
                            $rootScope.loggedIn=true;
                            console.log("logged in"+res);
                            $timeout(function(){ ngToast.create("Login successful! yay");});
                            $timeout(function(){$state.go("myBlogs");}, 1000);
                        },
                        function(err){
                            $timeout(function(){ngToast.create("login failed!");});
                            $rootScope.loggedIn=false;
                            console.log(err);
                        }
                    );
                }
            },
            function(err){
                $timeout(function(){ngToast.create("An error has occured please try again later");});
                console.log(err);
            }
        );
    }    
});


app.controller('SignupCtrl', function($scope, ngToast, $timeout){
    
   
   $scope.newUser={};
    $scope.signup=function(){
        if($scope.newUser.firstName && $scope.newUser.lastName && $scope.newUser.email && $scope.newUser.password && $scope.newUser.Confpassword){
            console.log("all fields are valid");
            
            if($scope.newUser.password==$scope.newUser.Confpassword){
                console.log("Passwords match");
                $scope.newUser.displayName=$scope.newUser.firstName+" "+$scope.newUser.lastName;
                Stamplay.User.signup($scope.newUser)
                .then(
                    function(response){
                        $timeout(function(){ngToast.create("account has been created, please login");});
                        console.log(response);
                    },
                    function(error){
                        $timeout(function(){ngToast.create("Some error has been occured, please try later");});
                        console.log(error);
                    }
                );
            }
            else{
                $timeout(function(){ngToast.create("passwords do not match");});
                console.log("passwords do not agree");
            }
        }
        else{
            ngToast.create("Some fields are not full");
            console.log("Some fields are not full");
        }
    };
    
});
//ng-if is faster than ng-show(always renders but hide id expression is false but ng-if will render if true)
//Stamplay required us to send something with ng-model= password, but maine password ka nd-model-'Password' likha tha to vo pehechan nai pa rha tha...
//text angular and ui-router are modules of ajs
//stateParams provides id of post from the url